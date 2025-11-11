const { errorResponse } = require('../utils/response');

/**
 * Validate request using Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return errorResponse(res, 400, 'Validation failed', errors);
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Validate multiple properties
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    for (const [property, schema] of Object.entries(schemas)) {
      const { error } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const propertyErrors = error.details.map((detail) => ({
          field: `${property}.${detail.path.join('.')}`,
          message: detail.message,
        }));
        errors.push(...propertyErrors);
      }
    }

    if (errors.length > 0) {
      return errorResponse(res, 400, 'Validation failed', errors);
    }

    next();
  };
};

module.exports = {
  validate,
  validateMultiple,
};
