/**
 * Success response wrapper
 */
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response wrapper
 */
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response wrapper
 */
const paginatedResponse = (res, statusCode, message, data, pagination) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
