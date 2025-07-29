import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    throw new Error("No token provided");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      throw new Error("invalid-token");
    } else {
      req.user = decoded;
      next();
    }
  });
};
