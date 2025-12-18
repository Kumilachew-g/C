const { Position, Department } = require('../models');

const listPositions = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const where = departmentId ? { departmentId } : {};
    const positions = await Position.findAll({
      where,
      include: [{ model: Department, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(
      positions.map((p) => ({
        id: p.id,
        name: p.name,
        departmentId: p.departmentId,
        departmentName: p.Department?.name,
        createdAt: p.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

const createPosition = async (req, res, next) => {
  try {
    const { name, departmentId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Position name is required.' });
    }
    if (!departmentId) {
      return res.status(400).json({ message: 'Department is required.' });
    }

    const position = await Position.create({
      name: name.trim(),
      departmentId,
    });

    res.status(201).json(position);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(400)
        .json({ message: 'Position with this name already exists in the selected department.' });
    }
    next(error);
  }
};

const updatePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, departmentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Position name is required.' });
    }

    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found.' });
    }

    position.name = name.trim();
    if (departmentId) {
      position.departmentId = departmentId;
    }
    await position.save();

    res.json(position);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(400)
        .json({ message: 'Position with this name already exists in the selected department.' });
    }
    next(error);
  }
};

const deletePosition = async (req, res, next) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found.' });
    }

    try {
      await position.destroy();
    } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          message: 'Cannot delete position because it is in use by users.',
        });
      }
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { listPositions, createPosition, updatePosition, deletePosition };


