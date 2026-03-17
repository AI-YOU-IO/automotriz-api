const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.clientError(400, 'Validation error', errors.array());
    }
    next();
};

module.exports = handleValidationErrors;

