const { Op } = require('sequelize');
const { AvailabilitySlot, User, Role } = require('../models');
const { ROLES } = require('../utils/roles');

const ensureCommissionerExists = async (commissionerId) => {
  const commissioner = await User.findByPk(commissionerId, { include: [Role] });
  if (!commissioner) {
    const error = new Error('Commissioner not found');
    error.status = 404;
    throw error;
  }
  if (!commissioner.Role || commissioner.Role.name !== ROLES.COMMISSIONER) {
    const error = new Error(
      `${commissioner.fullName || 'User'} is not configured as a commissioner`
    );
    error.status = 400;
    throw error;
  }
  return commissioner;
};

const checkOverlap = async (commissionerId, startTime, endTime, excludeId) => {
  const where = {
    commissionerId,
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime },
  };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const conflict = await AvailabilitySlot.findOne({ where });
  if (conflict) {
    const error = new Error('Availability overlaps with an existing slot');
    error.status = 400;
    throw error;
  }
};

const createSlot = async ({ commissionerId, startTime, endTime }, user) => {
  // If the caller is a commissioner, they may only create slots for themselves
  if (user.role === ROLES.COMMISSIONER && user.id !== commissionerId) {
    const error = new Error('Commissioners can only manage their own availability');
    error.status = 403;
    throw error;
  }

  await ensureCommissionerExists(commissionerId);
  await checkOverlap(commissionerId, startTime, endTime);
  return AvailabilitySlot.create({ commissionerId, startTime, endTime });
};

const listSlots = async (user, commissionerId) => {
  let where = {};

  if (commissionerId) {
    where = { commissionerId };
  } else if (user.role === ROLES.COMMISSIONER) {
    // Commissioners see their own availability by default
    where = { commissionerId: user.id };
  }

  const slots = await AvailabilitySlot.findAll({
    where,
    order: [['startTime', 'ASC']],
  });
  return slots.map((slot) => ({
    id: slot.id,
    commissionerId: slot.commissionerId,
    start: slot.startTime,
    end: slot.endTime,
  }));
};

const updateSlot = async (id, payload, user) => {
  const slot = await AvailabilitySlot.findByPk(id);
  if (!slot) {
    const error = new Error('Slot not found');
    error.status = 404;
    throw error;
  }
  // Only the owning commissioner may update a slot
  if (user.role !== ROLES.COMMISSIONER || user.id !== slot.commissionerId) {
    const error = new Error('Only the owning commissioner can update this availability slot');
    error.status = 403;
    throw error;
  }

  const newStart = payload.startTime ?? slot.startTime;
  const newEnd = payload.endTime ?? slot.endTime;
  await checkOverlap(slot.commissionerId, newStart, newEnd, id);
  slot.startTime = newStart;
  slot.endTime = newEnd;
  await slot.save();
  return slot;
};

const deleteSlot = async (id, user) => {
  const slot = await AvailabilitySlot.findByPk(id);
  if (!slot) {
    const error = new Error('Slot not found');
    error.status = 404;
    throw error;
  }
  // Only the owning commissioner may delete a slot
  if (user.role !== ROLES.COMMISSIONER || user.id !== slot.commissionerId) {
    const error = new Error('Only the owning commissioner can delete this availability slot');
    error.status = 403;
    throw error;
  }

  await slot.destroy();
  return { id };
};

const isCommissionerAvailable = async (commissionerId, startTime) => {
  const slot = await AvailabilitySlot.findOne({
    where: {
      commissionerId,
      startTime: { [Op.lte]: startTime },
      endTime: { [Op.gte]: startTime },
    },
  });
  return Boolean(slot);
};

module.exports = {
  createSlot,
  listSlots,
  updateSlot,
  deleteSlot,
  isCommissionerAvailable,
};

