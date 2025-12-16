const availabilityService = require('../services/availabilityService');

const createSlot = async (req, res, next) => {
  try {
    const slot = await availabilityService.createSlot(req.body);
    res.status(201).json(slot);
  } catch (error) {
    next(error);
  }
};

const listSlots = async (req, res, next) => {
  try {
    const slots = await availabilityService.listSlots(req.query.commissionerId);
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const slot = await availabilityService.updateSlot(req.params.id, req.body);
    res.json(slot);
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const result = await availabilityService.deleteSlot(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlot,
  listSlots,
  updateSlot,
  deleteSlot,
};

