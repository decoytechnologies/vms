const { Tenant, Admin } = require('../../models');
const { hashPassword } = require('../services/password.service');

exports.listTenants = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    const search = (req.query.search || '').trim();
    const where = search ? { name: { [require('sequelize').Op.iLike]: `%${search}%` } } : undefined;
    const { rows, count } = await Tenant.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize });
    res.status(200).json({ items: rows, total: count, page, pageSize });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tenants.' });
  }
};

exports.createTenant = async (req, res) => {
  const { name, subdomain } = req.body;
  if (!name || !subdomain) return res.status(400).json({ message: 'Name and subdomain are required.' });
  try {
    const tenant = await Tenant.create({ name, subdomain, isActive: true });
    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create tenant.' });
  }
};

exports.updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const { name, subdomain, isActive } = req.body;
  try {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });
    if (name !== undefined) tenant.name = name;
    if (subdomain !== undefined) tenant.subdomain = subdomain;
    if (isActive !== undefined) tenant.isActive = !!isActive;
    await tenant.save();
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tenant.' });
  }
};

exports.deleteTenant = async (req, res) => {
  const { tenantId } = req.params;
  try {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found.' });
    await tenant.destroy();
    // CASCADE deletes associated rows due to FK constraints
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete tenant.' });
  }
};

exports.listTenantAdmins = async (req, res) => {
  const { tenantId } = req.params;
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    const search = (req.query.search || '').trim();
    const where = { tenantId };
    if (search) {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    const { rows, count } = await Admin.findAndCountAll({ where, attributes: { exclude: ['passwordHash'] }, order: [['createdAt', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize });
    res.status(200).json({ items: rows, total: count, page, pageSize });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admins.' });
  }
};

exports.createTenantAdmin = async (req, res) => {
  const { tenantId } = req.params;
  const { email, name, password, phone } = req.body;
  if (!email || !name || !password) return res.status(400).json({ message: 'Email, name, and password are required.' });
  if (!/^[A-Za-z ]+$/.test(name)) return res.status(400).json({ message: 'Name must contain only letters and spaces.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
  if (phone && !/^\d{10}$/.test(phone)) return res.status(400).json({ message: 'Phone must be 10 digits.' });
  try {
    const passwordHash = await hashPassword(password);
    const admin = await Admin.create({ tenantId, email, name, phone, passwordHash });
    res.status(201).json({ id: admin.id, email: admin.email, name: admin.name, phone: admin.phone });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create admin.' });
  }
};

exports.deleteTenantAdmin = async (req, res) => {
  const { tenantId, adminId } = req.params;
  try {
    const admin = await Admin.findOne({ where: { id: adminId, tenantId } });
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    await admin.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete admin.' });
  }
};


exports.updateTenantAdmin = async (req, res) => {
  const { tenantId, adminId } = req.params;
  const { email, name, phone, password } = req.body;
  try {
    const admin = await Admin.findOne({ where: { id: adminId, tenantId } });
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    if (name !== undefined) {
      if (!/^[A-Za-z ]+$/.test(name)) return res.status(400).json({ message: 'Name must contain only letters and spaces.' });
      admin.name = name;
    }
    if (email !== undefined) {
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
      admin.email = email;
    }
    if (phone !== undefined) {
      if (phone && !/^\d{10}$/.test(phone)) return res.status(400).json({ message: 'Phone must be 10 digits.' });
      admin.phone = phone || null;
    }
    if (password) {
      admin.passwordHash = await hashPassword(password);
    }

    await admin.save();
    const { id, name: updatedName, email: updatedEmail, phone: updatedPhone } = admin;
    res.status(200).json({ id, name: updatedName, email: updatedEmail, phone: updatedPhone });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update admin.' });
  }
};


