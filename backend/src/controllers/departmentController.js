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
    const [dep, created] = await Department.findOrCreate({
      where: { name: name.trim() },
      defaults: { name: name.trim() },
    });
    res.status(created ? 201 : 200).json(dep);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Department already exists.' });
    }
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    department.name = name.trim();
    await department.save();

    res.json(department);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Department with this name already exists.' });
    }
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    try {
      await department.destroy();
    } catch (error) {
      // Handle potential foreign key constraint failures gracefully
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          message: 'Cannot delete department because it is in use by users or engagements.',
        });
      }
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
