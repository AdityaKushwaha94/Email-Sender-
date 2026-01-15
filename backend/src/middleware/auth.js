const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookies
    let token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Verify JWT secret exists
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is not blacklisted
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({ error: "Account access denied." });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token format." });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired. Please login again." });
    }
    res.status(500).json({
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Authentication failed",
    });
  }
};

module.exports = auth;
