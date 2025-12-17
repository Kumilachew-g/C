const { Department } = require('../models');

const listDepartments = async (_req, res, next) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required.' });
    }
    const [dep, created] = await Department.findOrCreate({ where: { name: name.trim() }, defaults: { name: name.trim() }});
    res.status(created ? 201 : 200).json(dep);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Department already exists.' });
    }
    next(error);
  }
};

module.exports = { listDepartments, createDepartment };
