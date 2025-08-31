// src/api/controllers/admin.controller.js
const { Op } = require('sequelize');
const { Guard, Visit, Visitor, Employee } = require('../../models');
const { Parser } = require('json2csv');
// New AWS SDK imports for generating pre-signed URLs
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// --- New Function: Get Image URLs ---
exports.getVisitImageUrls = async (req, res) => {
  const { visitId } = req.params;
  const { tenantId } = req.user;

  try {
    const visit = await Visit.findOne({ where: { id: visitId, tenantId } });
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found.' });
    }

    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const bucketParams = { Bucket: process.env.AWS_S3_BUCKET_NAME };

    const visitorPhotoUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ ...bucketParams, Key: visit.visitorPhotoUrl }),
      { expiresIn: 3600 } // URL is valid for 1 hour
    );

    const idPhotoUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ ...bucketParams, Key: visit.idCardPhotoUrl }),
      { expiresIn: 3600 }
    );

    res.status(200).json({ visitorPhotoUrl, idPhotoUrl });
  } catch (error) {
    console.error("Error generating signed URLs:", error);
    res.status(500).json({ message: 'Failed to retrieve image URLs.' });
  }
};

// --- Guard Management (CRUD) ---

exports.getGuards = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const guards = await Guard.findAll({ where: { tenantId }, attributes: { exclude: ['pinHash'] } });
    res.status(200).json(guards);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch guards.' });
  }
};

exports.createGuard = async (req, res) => {
  const { name, email, phone, pin } = req.body;
  const { tenantId } = req.user; // Correctly using tenantId from authenticated user
  if (!name || !pin) return res.status(400).json({ message: 'Guard name and PIN are required.' });
  try {
    const newGuard = await Guard.create({ name, email, phone, pinHash: pin, tenantId });
    // Return a subset of the data, excluding the hash
    const guardData = { id: newGuard.id, name: newGuard.name, email: newGuard.email, phone: newGuard.phone };
    res.status(201).json(guardData);
  } catch (error) {
    console.error("Error creating guard:", error);
    res.status(500).json({ message: 'Failed to create guard.' });
  }
};

exports.updateGuard = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, pin } = req.body;
  const { tenantId } = req.user;
  try {
    const guard = await Guard.findOne({ where: { id, tenantId } });
    if (!guard) return res.status(404).json({ message: 'Guard not found.' });
    
    guard.name = name || guard.name;
    guard.email = email;
    guard.phone = phone;
    if (pin) guard.pinHash = pin;

    await guard.save();
    const guardData = { id: guard.id, name: guard.name, email: guard.email, phone: guard.phone };
    res.status(200).json(guardData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update guard.' });
  }
};

exports.deleteGuard = async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const result = await Guard.destroy({ where: { id, tenantId } });
    if (result === 0) return res.status(404).json({ message: 'Guard not found.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete guard.' });
  }
};


// --- Reporting ---

exports.downloadVisitorLog = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const visits = await Visit.findAll({
      where: { tenantId },
      include: [
        { model: Visitor, attributes: ['name', 'email', 'phone'] },
        { model: Employee, attributes: ['name', 'email'], as: 'Employee' },
      ],
      order: [['checkInTimestamp', 'DESC']],
      raw: true, // Important for flattening the data
      nest: true,
    });

    if (visits.length === 0) return res.status(404).json({ message: 'No visit data to export.' });

    // Calculate length of stay
    const processedVisits = visits.map(visit => {
      let lengthOfStay = 'N/A';
      if (visit.actualCheckOutTimestamp) {
        const durationMs = new Date(visit.actualCheckOutTimestamp) - new Date(visit.checkInTimestamp);
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        lengthOfStay = `${hours}h ${minutes}m`;
      }
      return {
        'Visitor Name': visit.Visitor.name,
        'Visitor Email': visit.Visitor.email,
        'Visitor Phone': visit.Visitor.phone,
        'Host Name': visit.Employee.name,
        'Host Email': visit.Employee.email,
        'Check-in Time': new Date(visit.checkInTimestamp).toLocaleString(),
        'Check-out Time': visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'Still Inside',
        'Length of Stay': lengthOfStay,
        'Status': visit.status,
      };
    });

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(processedVisits);

    res.header('Content-Type', 'text/csv');
    res.attachment('visitor-report.csv');
    res.send(csv);

  } catch (error) {
    res.status(500).json({ message: 'Failed to generate CSV report.' });
  }
};

exports.searchEmployees = async (req, res) => {
  const { tenantId } = req.user;
  const { query } = req.query;

  if (!query || query.length < 3) {
    return res.json([]);
  }

  try {
    const employees = await Employee.findAll({
      where: {
        tenantId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 5
    });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search employees.' });
  }
};

exports.getVisitsByEmployee = async (req, res) => {
  const { tenantId } = req.user;
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Employee email is required.' });
  }

  try {
    const employee = await Employee.findOne({ where: { email, tenantId } });

    if (!employee) {
      return res.status(404).json({ message: `Employee with email ${email} not found.` });
    }

    const visits = await Visit.findAll({
      where: { employeeId: employee.id },
      include: [{ model: Visitor, attributes: ['name', 'email', 'phone'] }],
      order: [['checkInTimestamp', 'DESC']],
    });

    res.status(200).json({ employee, visits });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employee visit records.' });
  }
};

exports.getEndOfDayReport = async (req, res) => {
  const { tenantId } = req.user;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const visitsToday = await Visit.findAll({
      where: {
        tenantId,
        checkInTimestamp: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      include: [
        { model: Visitor, attributes: ['name', 'email'] },
        { model: Employee, attributes: ['name'], as: 'Employee' },
      ],
      order: [['checkInTimestamp', 'ASC']],
    });

    const stillInside = visitsToday.filter(v => v.status === 'CHECKED_IN' || v.status === 'PENDING_APPROVAL');
    const haveLeft = visitsToday.filter(v => v.status === 'CHECKED_OUT' || v.status === 'DENIED');
    
    res.status(200).json({ stillInside, haveLeft });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report.' });
  }
};

exports.getAllVisits = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const visits = await Visit.findAll({
      where: { tenantId },
      include: [
        { model: Visitor, attributes: ['name', 'email', 'phone'] },
        { model: Employee, attributes: ['name', 'email'], as: 'Employee' },
        { model: Guard, attributes: ['name'], as: 'CheckInGuard' },
      ],
      order: [['checkInTimestamp', 'DESC']],
    });
    res.status(200).json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch visit records.' });
  }
};

// This function must exist and be exported
exports.createGuard = async (req, res) => {
  // This line is the fix: we are now correctly reading email and phone from the request body.
  const { name, email, phone, pin } = req.body;
  const { tenantId } = req.user;

  if (!name || !pin) {
    return res.status(400).json({ message: 'Guard name and PIN are required.' });
  }

  try {
    // And here we pass them to the database create command.
    const newGuard = await Guard.create({ name, email, phone, pinHash: pin, tenantId });
    
    // We also return the full guard object so the UI updates correctly.
    res.status(201).json({ 
      id: newGuard.id, 
      name: newGuard.name, 
      email: newGuard.email, 
      phone: newGuard.phone 
    });
  } catch (error) {
    console.error('Error creating guard:', error);
    res.status(500).json({ message: 'Failed to create guard.' });
  }
};