const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message, err.stack);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
  });
};

export default errorHandler;
