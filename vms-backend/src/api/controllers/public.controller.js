const { Tenant } = require('../../models');
const logger = require('../services/logger.service');

exports.listActiveTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({ where: { isActive: true }, attributes: ['id', 'name', 'subdomain', 'isActive'], order: [['name', 'ASC']] });
    res.status(200).json(tenants);
  } catch (error) {
    logger.error('listActiveTenants failed', { error, path: req.path });
    res.status(500).json({ message: 'Failed to load tenants.' });
  }
};


