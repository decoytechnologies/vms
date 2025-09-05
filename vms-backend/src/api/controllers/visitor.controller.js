const { Op } = require('sequelize');
const { Visitor, Visit, Employee, sequelize } = require('../../models');
const storageService = require('../services/storage.service');
const { v4: uuidv4 } = require('uuid');

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

    const approvalToken = uuidv4();
    const ttlMinutes = parseInt(process.env.APPROVAL_TOKEN_TTL_MINUTES || '120', 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60000);

    const visit = await Visit.create({
      tenantId: tenant.id,
      visitorId: visitor.id,
      employeeId: hostEmployee.id,
      checkInGuardId: guard.id,
      status: 'PENDING_APPROVAL',
      visitType: 'VISITOR',
      approvalMethod: 'PRE_APPROVED_EMAIL',
      approvalToken,
      approvalTokenExpiresAt: expiresAt,
      checkInTimestamp: new Date(),
      visitorPhotoUrl,
      idCardPhotoUrl,
    }, { transaction: t });

    await t.commit();
    // TODO: send email to host with approve/deny links using approvalToken (separate service)
    res.status(201).json({ message: 'Approval requested. Awaiting host approval.', visitId: visit.id, status: visit.status, approvalToken });
  } catch (error) {
    await t.rollback();
    console.error('Check-in Error:', error);
    res.status(500).json({ message: 'An error occurred during the check-in process.' });
  }
};

exports.guardOverrideApprove = async (req, res) => {
  const { visitId } = req.params;
  const { id: guardId } = req.user;
  try {
    const visit = await Visit.findByPk(visitId);
    if (!visit) return res.status(404).json({ message: 'Visit not found.' });
    // Allow override from any non-checked-out state
    if (visit.status !== 'CHECKED_OUT') {
      visit.status = 'CHECKED_IN';
      visit.approvalMethod = 'AUTO_APPROVED';
      visit.approvedAt = new Date();
      visit.approvedByEmail = 'guard-override';
      visit.checkInGuardId = visit.checkInGuardId || guardId;
      await visit.save();
      return res.status(200).json({ message: 'Visit approved by guard override.', status: visit.status });
    }
    return res.status(400).json({ message: 'Cannot override a checked-out visit.' });
  } catch (error) {
    console.error('Override approve failed', error);
    res.status(500).json({ message: 'Failed to approve visit.' });
  }
};

exports.getActiveVisits = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const activeVisits = await Visit.findAll({
      where: { tenantId, status: 'CHECKED_IN' },
      include: [
        { model: Visitor, attributes: ['name', 'email', 'phone'] }, // include email for EOD details
        { model: Employee, attributes: ['name', 'email', 'phone'], as: 'Employee' }
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

exports.getVisitStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await Visit.findByPk(id, { attributes: ['id', 'status'] });
    if (!visit) return res.status(404).json({ message: 'Visit not found.' });
    res.status(200).json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch visit status.' });
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
        { model: Employee, attributes: ['name', 'email'], as: 'Employee' },
      ],
    });

    if (!visit || !visit.visitorPhotoUrl || !visit.idCardPhotoUrl) {
      return res.status(404).json({ message: 'Visit details or images not found.' });
    }

    const visitorPhotoUrl = await storageService.getSignedUrl(visit.visitorPhotoUrl, 300);
    const idPhotoUrl = await storageService.getSignedUrl(visit.idCardPhotoUrl, 300);

    const phone = visit.Visitor.phone;
    const maskedPhone = `${phone.substring(0, 3)}****${phone.substring(phone.length - 2)}`;

    res.json({
      visitorName: visit.Visitor.name,
      visitorEmail: visit.Visitor.email,
      visitorPhoneMasked: maskedPhone,
      hostName: visit.Employee?.name || 'N/A',
      hostEmail: visit.Employee?.email || 'N/A',
      checkInTime: visit.checkInTimestamp,
      visitorPhotoUrl,
      idPhotoUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load visit details.' });
  }
};

// Search APIs remain unchanged
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

exports.getPendingVisits = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const pending = await Visit.findAll({
      where: { tenantId, status: 'PENDING_APPROVAL' },
      include: [
        { model: Visitor, attributes: ['name', 'email', 'phone'] },
        { model: Employee, attributes: ['name', 'email'], as: 'Employee' },
      ],
      attributes: ['id', 'checkInTimestamp'],
      order: [['checkInTimestamp', 'ASC']],
    });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending approvals.' });
  }
};
