// vms-backend/src/api/middlewares/tenant.middleware.js
const { Tenant } = require('../../models');

const tenantResolver = async (req, res, next) => {
  let subdomain;
  if (process.env.NODE_ENV === 'development') {
    subdomain = req.header('x-tenant-subdomain');
  } else {
    subdomain = req.hostname.split('.')[0];
  }

  if (!subdomain) return res.status(400).json({ message: 'Could not identify tenant.' });

  try {
    const tenant = await Tenant.findOne({ where: { subdomain } });
    if (!tenant) return res.status(404).json({ message: `Tenant '${subdomain}' not found.` });
    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error resolving tenant.' });
  }
};

module.exports = { tenantResolver };