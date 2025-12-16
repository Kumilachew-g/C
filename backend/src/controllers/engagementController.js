const engagementService = require('../services/engagementService');

const createEngagement = async (req, res, next) => {
  try {
    const engagement = await engagementService.createEngagement(
      req.body,
      req.user.id
    );
    res.locals.entityId = engagement.id;
    res.status(201).json(engagement);
  } catch (error) {
    next(error);
  }
};

const listEngagements = async (req, res, next) => {
  try {
    const engagements = await engagementService.listEngagements(req.user);
    res.json(engagements);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const engagement = await engagementService.updateEngagementStatus(
      req.params.id,
      status,
      req.user
    );
    res.locals.entityId = engagement.id;
    res.json(engagement);
  } catch (error) {
    next(error);
  }
};

module.exports = { createEngagement, listEngagements, updateStatus };

