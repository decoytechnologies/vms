const { Op } = require('sequelize');
const { Admin, Guard, Visit, Visitor, Employee } = require('../../models');
const { Parser } = require('json2csv');
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
    res.status(200).json({ id: guard.id, name: guard.name, email: guard.email, phone: guard.phone });
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

// --- Employee Management (CRUD) ---
exports.getEmployees = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const employees = await Employee.findAll({ 
      where: { tenantId },
      include: [{
        model: Visit,
        attributes: ['id'],
        required: false
      }],
      order: [['name', 'ASC']]
    });
    
    // Add visitor count to each employee
    const employeesWithStats = employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      createdAt: employee.createdAt,
      visitorCount: employee.Visits ? employee.Visits.length : 0
    }));
    
    res.status(200).json(employeesWithStats);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Failed to fetch employees.' });
  }
};

exports.createEmployee = async (req, res) => {
  const { name, email, phone, department } = req.body;
  const { tenantId } = req.user;
  
  if (!name || !email) {
    return res.status(400).json({ message: 'Employee name and email are required.' });
  }
  
  try {
    // Check if employee with this email already exists
    const existingEmployee = await Employee.findOne({ where: { email, tenantId } });
    if (existingEmployee) {
      return res.status(409).json({ message: 'Employee with this email already exists.' });
    }
    
    const newEmployee = await Employee.create({ 
      name, 
      email, 
      phone, 
      department, 
      tenantId 
    });
    
    res.status(201).json({
      id: newEmployee.id,
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      department: newEmployee.department,
      visitorCount: 0
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Failed to create employee.' });
  }
};

exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, department } = req.body;
  const { tenantId } = req.user;
  
  try {
    const employee = await Employee.findOne({ where: { id, tenantId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    
    // Check if email is being changed and if it conflicts with another employee
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ where: { email, tenantId } });
      if (existingEmployee) {
        return res.status(409).json({ message: 'Employee with this email already exists.' });
      }
    }
    
    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.phone = phone;
    employee.department = department;
    
    await employee.save();
    
    // Get visitor count
    const visitorCount = await Visit.count({ where: { employeeId: employee.id } });
    
    res.status(200).json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      visitorCount
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Failed to update employee.' });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  try {
    const employee = await Employee.findOne({ where: { id, tenantId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    
    // Check if employee has any visits
    const visitCount = await Visit.count({ where: { employeeId: employee.id } });
    if (visitCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete employee. They have ${visitCount} associated visit(s). Please contact admin to reassign visits first.` 
      });
    }
    
    await employee.destroy();
    res.status(200).json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Failed to delete employee.' });
  }
};

exports.bulkCreateEmployees = async (req, res) => {
  const { employees } = req.body;
  const { tenantId } = req.user;
  
  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ message: 'Employees array is required.' });
  }
  
  try {
    const results = {
      created: [],
      errors: [],
      duplicates: []
    };
    
    // First, validate the CSV for internal duplicates and basic validation
    const emailMap = new Map();
    const processedEmployees = [];
    
    for (let i = 0; i < employees.length; i++) {
      const { name, email, phone, department } = employees[i];
      
      // Check for required fields
      if (!name || !email) {
        results.errors.push({
          row: i + 1,
          data: employees[i],
          error: 'Name and email are required'
        });
        continue;
      }
      
      // Normalize email to lowercase for consistent checking
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check for duplicates within the CSV file itself
      if (emailMap.has(normalizedEmail)) {
        results.duplicates.push({
          row: i + 1,
          data: employees[i],
          error: `Duplicate email in CSV file (also found at row ${emailMap.get(normalizedEmail)})`
        });
        continue;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        results.errors.push({
          row: i + 1,
          data: employees[i],
          error: 'Invalid email format'
        });
        continue;
      }
      
      // Validate phone number if provided
      if (phone && phone.trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(phone.trim())) {
          results.errors.push({
            row: i + 1,
            data: employees[i],
            error: 'Invalid phone number format'
          });
          continue;
        }
      }
      
      emailMap.set(normalizedEmail, i + 1);
      processedEmployees.push({
        ...employees[i],
        email: normalizedEmail,
        originalRow: i + 1
      });
    }
    
    // Now process the validated employees against the database
    for (const employeeData of processedEmployees) {
      const { name, email, phone, department, originalRow } = employeeData;
      
      try {
        // Check if employee already exists in database
        const existing = await Employee.findOne({ where: { email, tenantId } });
        if (existing) {
          results.duplicates.push({
            row: originalRow,
            data: { name, email, phone, department },
            error: 'Employee with this email already exists in database'
          });
          continue;
        }
        
        const newEmployee = await Employee.create({
          name: name.trim(),
          email,
          phone: phone ? phone.trim() : null,
          department: department ? department.trim() : null,
          tenantId
        });
        
        results.created.push({
          row: originalRow,
          employee: {
            id: newEmployee.id,
            name: newEmployee.name,
            email: newEmployee.email,
            phone: newEmployee.phone,
            department: newEmployee.department
          }
        });
      } catch (error) {
        results.errors.push({
          row: originalRow,
          data: { name, email, phone, department },
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Bulk upload completed. Created: ${results.created.length}, Errors: ${results.errors.length}, Duplicates: ${results.duplicates.length}`,
      results
    });
  } catch (error) {
    console.error('Error in bulk employee creation:', error);
    res.status(500).json({ message: 'Failed to process bulk employee creation.' });
  }
};

exports.downloadEmployeeTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        phone: '1234567890',
        department: 'Engineering'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        phone: '0987654321',
        department: 'Marketing'
      }
    ];
    
    const fields = [
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Department', value: 'department' }
    ];
    
    const parser = new Parser({ fields });
    const csv = parser.parse(templateData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_template.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating employee template:', error);
    res.status(500).json({ message: 'Failed to generate employee template.' });
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

// --- Admin Management (CRUD) ---

exports.getAdmins = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const admins = await Admin.findAll({ 
      where: { tenantId }, 
      attributes: { exclude: ['pinHash'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Failed to fetch admins.' });
  }
};

exports.createAdmin = async (req, res) => {
  const { name, email, phone, pin } = req.body;
  const { tenantId } = req.user;
  
  if (!name || !pin) {
    return res.status(400).json({ message: 'Admin name and PIN are required.' });
  }

  try {
    // Check if we already have 5 admins for this tenant
    const adminCount = await Admin.count({ where: { tenantId } });
    if (adminCount >= 5) {
      return res.status(400).json({ message: 'Maximum of 5 admins allowed per tenant.' });
    }

    // Check if email is already taken
    if (email) {
      const existingAdmin = await Admin.findOne({ where: { email, tenantId } });
      if (existingAdmin) {
        return res.status(400).json({ message: 'An admin with this email already exists.' });
      }
    }

    const newAdmin = await Admin.create({ 
      name, 
      email, 
      phone, 
      pinHash: pin, 
      tenantId, 
      isActive: true 
    });
    
    res.status(201).json({ 
      id: newAdmin.id, 
      name: newAdmin.name, 
      email: newAdmin.email, 
      phone: newAdmin.phone 
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Failed to create admin.' });
  }
};

exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, pin } = req.body;
  const { tenantId } = req.user;
  
  try {
    const admin = await Admin.findOne({ where: { id, tenantId } });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    
    // Check if email is already taken by another admin
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ where: { email, tenantId } });
      if (existingAdmin) {
        return res.status(400).json({ message: 'An admin with this email already exists.' });
      }
    }
    
    admin.name = name || admin.name;
    admin.email = email;
    admin.phone = phone;
    if (pin) admin.pinHash = pin;

    await admin.save();
    res.status(200).json({ 
      id: admin.id, 
      name: admin.name, 
      email: admin.email, 
      phone: admin.phone 
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ message: 'Failed to update admin.' });
  }
};

exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  try {
    const admin = await Admin.findOne({ where: { id, tenantId } });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    
    // Prevent deleting the last admin
    const adminCount = await Admin.count({ where: { tenantId } });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last admin. At least one admin must remain.' });
    }
    
    await admin.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Failed to delete admin.' });
  }
};
