const sendResponse = (res, options) => {
  const {
    success = true,
    statusCode = 200,
    message = '',
    data = null,
    meta = null,
    error = null
  } = options;

  const response = {
    success,
    message,
    statusCode
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  if (error !== null && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};


export const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  return sendResponse(res, {
    success: true,
    statusCode,
    message,
    data,
    meta
  });
};


export const sendError = (res, message = 'Error occurred', statusCode = 500, error = null) => {
  return sendResponse(res, {
    success: false,
    statusCode,
    message,
    error
  });
};

export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};


export const sendNoContent = (res, message = 'No content') => {
  return sendResponse(res, {
    success: true,
    statusCode: 204,
    message,
    data: null
  });
};

export default sendResponse;