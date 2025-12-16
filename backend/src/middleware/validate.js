const { validationResult } = require('express-validator');

// Runs validation chains and formats the response if errors exist.
const validate = (checks) => [
  ...checks,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    return next();
  },
];

module.exports = validate;

