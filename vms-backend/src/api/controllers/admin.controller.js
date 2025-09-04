const { Op } = require('sequelize');
const { Guard, Visit, Visitor, Employee } = require('../../models');
const { Parser } = require('json2csv');
const csvParse = require('csv-parse/sync');
const PDFDocument = require('pdfkit');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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
  const { tenantId } = req.user;
  if (!name || !pin) return res.status(400).json({ message: 'Guard name and PIN are required.' });
  if (!/^[0-9]{4,6}$/.test(String(pin))) return res.status(400).json({ message: 'PIN must be 4-6 digits.' });
  try {
    const newGuard = await Guard.create({ name, email, phone, pinHash: pin, tenantId, isActive: true });
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

exports.updateGuard = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, pin, isActive } = req.body;
  const { tenantId } = req.user;
  try {
    const guard = await Guard.findOne({ where: { id, tenantId } });
    if (!guard) return res.status(404).json({ message: 'Guard not found.' });
    
    guard.name = name || guard.name;
    guard.email = email;
    guard.phone = phone;
    if (typeof isActive === 'boolean') {
      guard.isActive = isActive;
    }
    if (pin) {
      if (!/^[0-9]{4,6}$/.test(String(pin))) return res.status(400).json({ message: 'PIN must be 4-6 digits.' });
      guard.pinHash = String(pin);
    }

    await guard.save();
    res.status(200).json({ id: guard.id, name: guard.name, email: guard.email, phone: guard.phone, isActive: guard.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update guard.' });
  }
};

exports.deleteGuard = async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  try {
    const guard = await Guard.findOne({ where: { id, tenantId } });
    if (!guard) return res.status(404).json({ message: 'Guard not found.' });
    await guard.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete guard.' });
  }
};


// --- Visitor Data & Reports ---

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
    console.error("Error fetching visits:", error);
    res.status(500).json({ message: 'Failed to fetch visit records.' });
  }
};

exports.getVisitImageUrls = async (req, res) => {
  const { visitId } = req.params;
  const { tenantId } = req.user;
  try {
    const visit = await Visit.findOne({ where: { id: visitId, tenantId } });
    if (!visit || !visit.visitorPhotoUrl || !visit.idCardPhotoUrl) {
      return res.status(404).json({ message: 'Visit or images not found.' });
    }
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const getParams = (key) => ({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key });
    const visitorPhotoUrl = await getSignedUrl(s3Client, new GetObjectCommand(getParams(visit.visitorPhotoUrl)), { expiresIn: 3600 });
    const idPhotoUrl = await getSignedUrl(s3Client, new GetObjectCommand(getParams(visit.idCardPhotoUrl)), { expiresIn: 3600 });
    res.json({ visitorPhotoUrl, idPhotoUrl });
  } catch (error) {
    res.status(500).json({ message: 'Could not generate image URLs.' });
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
        checkInTimestamp: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
      include: [
        { model: Visitor, attributes: ['name'] },
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

exports.getVisitsByEmployee = async (req, res) => {
  const { tenantId } = req.user;
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Employee email is required.' });
  try {
    const employee = await Employee.findOne({ where: { email, tenantId } });
    if (!employee) return res.status(404).json({ message: `Employee with email ${email} not found.` });
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

exports.searchEmployees = async (req, res) => {
  const { tenantId } = req.user;
  const { query } = req.query;
  if (!query || query.length < 3) return res.json([]);
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

exports.downloadVisitorLog = async (req, res) => {
    const { tenantId } = req.user;
    const { format, columns, startDate, endDate } = req.body;
    try {
        const visits = await Visit.findAll({
            where: { tenantId, checkInTimestamp: { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) } },
            include: [
                { model: Visitor, attributes: ['name', 'email', 'phone'] },
                { model: Employee, attributes: ['name', 'email'], as: 'Employee' },
            ],
            order: [['checkInTimestamp', 'DESC']],
            raw: true,
            nest: true,
        });
        if (visits.length === 0) return res.status(404).send('No visit data found for the selected range.');
        const processedVisits = visits.map(visit => {
            let lengthOfStay = 'N/A';
            if (visit.actualCheckOutTimestamp) {
                const durationMs = new Date(visit.actualCheckOutTimestamp) - new Date(visit.checkInTimestamp);
                const hours = Math.floor(durationMs / 3600000);
                const minutes = Math.floor((durationMs % 3600000) / 60000);
                lengthOfStay = `${hours}h ${minutes}m`;
            }
            const record = {
                'Visitor Name': visit.Visitor.name, 'Visitor Email': visit.Visitor.email, 'Visitor Phone': visit.Visitor.phone,
                'Host Name': visit.Employee.name, 'Host Email': visit.Employee.email,
                'Check-in Time': new Date(visit.checkInTimestamp).toLocaleString(),
                'Check-out Time': visit.actualCheckOutTimestamp ? new Date(visit.actualCheckOutTimestamp).toLocaleString() : 'Still Inside',
                'Length of Stay': lengthOfStay, 'Status': visit.status,
            };
            const filteredRecord = {};
            columns.forEach(col => { if (record[col] !== undefined) filteredRecord[col] = record[col]; });
            return filteredRecord;
        });

        if (format === 'csv') {
            const json2csvParser = new Parser({ fields: columns });
            const csv = json2csvParser.parse(processedVisits);
            res.header('Content-Type', 'text/csv');
            res.attachment('visitor-report.csv');
            res.send(csv);
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50, layout: 'landscape', size: 'A4' });
            res.header('Content-Type', 'application/pdf');
            res.header('Content-Disposition', 'attachment; filename=visitor-report.pdf');
            doc.pipe(res);
            
            const logoPath = path.join(__dirname, '../../logo.png'); // Correct path
            doc.image(logoPath, { fit: [100, 100], align: 'center' }).moveDown(2);
            doc.fontSize(24).font('Helvetica-Bold').text('Visitor Management System Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).font('Helvetica').text(`Report Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.fontSize(12).text(`Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
            doc.addPage();

            const tableTop = 50;
            const columnWidths = columns.map(() => (doc.page.width - 100) / columns.length);
            doc.fontSize(10).font('Helvetica-Bold');
            columns.forEach((header, i) => {
                doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, { width: columnWidths[i] - 10, align: 'left' });
            });
            doc.moveTo(50, tableTop + 15).lineTo(doc.page.width - 50, tableTop + 15).stroke();

            doc.fontSize(8).font('Helvetica');
            let y = tableTop + 25;
            processedVisits.forEach(row => {
                if (y > doc.page.height - 50) {
                    doc.addPage();
                    y = tableTop;
                }
                columns.forEach((header, i) => {
                    doc.text(String(row[header] || 'N/A'), 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: columnWidths[i] - 10, align: 'left' });
                });
                y += 20;
            });
            doc.end();
        }
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: 'Failed to generate report.' });
    }
};

// --- Employee Management (CRUD + CSV Upload/Template) ---

exports.getEmployees = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const employees = await Employee.findAll({ where: { tenantId } });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employees.' });
  }
};

exports.createEmployee = async (req, res) => {
  const { tenantId } = req.user;
  const { name, email, phone, department } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });
  try {
    const existing = await Employee.findOne({ where: { tenantId, email } });
    if (existing) return res.status(409).json({ message: 'Employee with this email already exists.' });
    const emp = await Employee.create({ tenantId, name, email, phone: phone || null, department: department || null });
    res.status(201).json(emp);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create employee.' });
  }
};

exports.updateEmployee = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { name, email, phone, department } = req.body;
  try {
    const emp = await Employee.findOne({ where: { id, tenantId } });
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    if (email && email !== emp.email) {
      const dup = await Employee.findOne({ where: { tenantId, email } });
      if (dup) return res.status(409).json({ message: 'Another employee with this email already exists.' });
    }
    emp.name = name ?? emp.name;
    emp.email = email ?? emp.email;
    emp.phone = phone ?? emp.phone;
    emp.department = department ?? emp.department;
    await emp.save();
    res.status(200).json(emp);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update employee.' });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  try {
    const emp = await Employee.findOne({ where: { id, tenantId } });
    if (!emp) return res.status(404).json({ message: 'Employee not found.' });
    await emp.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete employee.' });
  }
};

exports.downloadEmployeeTemplate = async (_req, res) => {
  const fields = ['name', 'email', 'phone', 'department'];
  const parser = new Parser({ fields });
  const csv = parser.parse([]);
  res.header('Content-Type', 'text/csv');
  res.attachment('employee-template.csv');
  res.send(csv);
};

exports.uploadEmployeesCsv = async (req, res) => {
  const { tenantId } = req.user;
  if (!req.file) return res.status(400).json({ message: 'CSV file is required.' });
  try {
    const content = req.file.buffer.toString('utf-8');
    const records = csvParse.parse(content, { columns: true, skip_empty_lines: true, trim: true });
    let inserted = 0;
    let duplicates = 0;
    const duplicateEmails = [];
    const createdIds = [];
    for (const row of records) {
      const name = (row.name || '').trim();
      const email = (row.email || '').trim();
      const phone = (row.phone || '').trim() || null;
      const department = (row.department || '').trim() || null;
      if (!name || !email) continue; // skip invalid rows
      const exists = await Employee.findOne({ where: { tenantId, email } });
      if (exists) { duplicates++; duplicateEmails.push(email); continue; }
      const emp = await Employee.create({ tenantId, name, email, phone, department });
      createdIds.push(emp.id);
      inserted++;
    }
    res.status(200).json({ inserted, duplicates, duplicateEmails, createdIds });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process CSV upload.' });
  }
};