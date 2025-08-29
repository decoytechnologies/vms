// src/api/controllers/admin.controller.js
const { Guard, Visit, Visitor, Employee } = require('../../models');
const { Op } = require('sequelize');

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
  const { name, pin } = req.body;
  const { id: tenantId } = req.tenant;

  if (!name || !pin) {
    return res.status(400).json({ message: 'Name and pin are required.' });
  }
  try {
    const newGuard = await Guard.create({
      name,
      pinHash: pin, // The model hook will hash this automatically
      tenantId: tenantId,
      isActive: true,
    });
    res.status(201).json({
        message: 'Guard created successfully. You can now log in.',
        guard: { id: newGuard.id, name: newGuard.name }
    });
  } catch (error) {
    console.error('Error creating guard:', error);
    res.status(500).json({ message: 'Failed to create guard.', error: error.message });
  }
};