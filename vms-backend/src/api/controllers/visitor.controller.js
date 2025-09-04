const { Op } = require('sequelize');
const { Visitor, Visit, Employee, sequelize } = require('../../models');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

exports.checkIn = async (req, res) => {
  const { name, email, phone, employeeEmail } = req.body;
  const { tenant, user: guard } = req;
  if (!name || !email || !phone || !employeeEmail) return res.status(400).json({ message: 'Missing required visitor information.' });
  if (!req.files?.visitorPhoto?.[0] || !req.files?.idPhoto?.[0]) return res.status(400).json({ message: 'Visitor photo and ID photo are required.' });
  const visitorPhotoUrl = req.files.visitorPhoto[0].key;
  const idCardPhotoUrl = req.files.idPhoto[0].key;
  const t = await sequelize.transaction();
  try {
    const [visitor] = await Visitor.findOrCreate({ where: { email, tenantId: tenant.id }, defaults: { name, phone, tenantId: tenant.id }, transaction: t });
    const hostEmployee = await Employee.findOne({ where: { email: employeeEmail, tenantId: tenant.id }, transaction: t });
    if (!hostEmployee) {
      await t.rollback();
      return res.status(404).json({ message: `Host employee with email ${employeeEmail} not found.` });
    }
    const approvalStatus = 'CHECKED_IN';
    const approvalMethod = 'AUTO_APPROVED';
    const newVisit = await Visit.create({ tenantId: tenant.id, visitorId: visitor.id, employeeId: hostEmployee.id, checkInGuardId: guard.id, status: approvalStatus, visitType: 'VISITOR', visitorPhotoUrl, idCardPhotoUrl, approvalMethod }, { transaction: t });
    await t.commit();
    res.status(201).json({ message: `Visitor successfully checked in. Status: ${approvalStatus}`, visit: newVisit });
  } catch (error) {
    await t.rollback();
    console.error('Check-in Error:', error);
    res.status(500).json({ message: 'An error occurred during the check-in process.' });
  }
};

exports.getActiveVisits = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const activeVisits = await Visit.findAll({
      where: { tenantId, status: 'CHECKED_IN' },
      include: [
        { model: Visitor, attributes: ['name', 'phone'] }, // Added phone for duplicate check
        { model: Employee, attributes: ['name', 'email'], as: 'Employee' }
      ],
      attributes: ['id', 'checkInTimestamp'], // Include checkInTimestamp for stay duration
      order: [['checkInTimestamp', 'ASC']]
    });
    res.status(200).json(activeVisits);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active visitors.' });
  }
};

exports.checkOut = async (req, res) => {
  // This function remains the same
  const { id: visitId } = req.params;
  const { id: guardId } = req.user;
  try {
    const visit = await Visit.findByPk(visitId);
    if (!visit) return res.status(404).json({ message: 'Visit not found.' });
    visit.status = 'CHECKED_OUT';
    visit.actualCheckOutTimestamp = new Date();
    visit.checkOutGuardId = guardId;
    await visit.save();
    res.status(200).json({ message: 'Visitor checked out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check out visitor.' });
  }
};

exports.getVisitDetailsForGuard = async (req, res) => {
  const { visitId } = req.params;
  const { tenantId } = req.user;

  try {
    const visit = await Visit.findOne({
      where: { id: visitId, tenantId },
      include: [
        { model: Visitor, attributes: ['name', 'email', 'phone'] },
        // We now select the email from the Employee model
        { model: Employee, attributes: ['name', 'email'], as: 'Employee' },
      ],
    });

    if (!visit || !visit.visitorPhotoUrl || !visit.idCardPhotoUrl) {
      return res.status(404).json({ message: 'Visit details or images not found.' });
    }

    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const getParams = (key) => ({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key });
    const visitorPhotoUrl = await getSignedUrl(s3Client, new GetObjectCommand(getParams(visit.visitorPhotoUrl)), { expiresIn: 300 });
    const idPhotoUrl = await getSignedUrl(s3Client, new GetObjectCommand(getParams(visit.idCardPhotoUrl)), { expiresIn: 300 });

    const phone = visit.Visitor.phone;
    const maskedPhone = `${phone.substring(0, 3)}****${phone.substring(phone.length - 2)}`;

    // The final response object now includes hostEmail
    const visitDetails = {
      visitorName: visit.Visitor.name,
      visitorEmail: visit.Visitor.email,
      visitorPhoneMasked: maskedPhone,
      hostName: visit.Employee.name,
      hostEmail: visit.Employee.email, // <-- ADDED THIS LINE
      checkInTime: visit.checkInTimestamp,
      visitorPhotoUrl,
      idPhotoUrl,
    };

    res.status(200).json(visitDetails);
  } catch (error) {
    console.error("Error fetching guard visit details:", error);
    res.status(500).json({ message: 'Could not generate visit details.' });
  }
};

// We comment out the notification service for now to bypass live API calls
// const notificationService = require('../services/notification.service');


    // --- TEMPORARY TEST CODE ---
    // We are skipping the notification check and auto-approving all visitors.
    console.log("--- DEVELOPMENT MODE: Skipping live email/chat check and auto-approving visitor. ---");
    const approvalStatus = 'CHECKED_IN';
    const approvalMethod = 'AUTO_APPROVED';
    // --- END TEMPORARY TEST CODE ---
    

// ... (The rest of the controller functions remain the same)

exports.searchVisitorByEmail = async (req, res) => {
  const { tenantId } = req.user;
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    const visitor = await Visitor.findOne({ where: { email, tenantId } });
    if (visitor) res.status(200).json(visitor);
    else res.status(404).json({ message: 'Visitor not found.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search for visitor.' });
  }
};

exports.searchVisitorsByPhone = async (req, res) => {
  const { tenantId } = req.user;
  const { phone } = req.query;
  if (!phone || phone.length < 3) return res.json([]);
  try {
    const visitors = await Visitor.findAll({ where: { tenantId, phone: { [Op.iLike]: `${phone}%` } }, limit: 5 });
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search visitors.' });
  }
};
