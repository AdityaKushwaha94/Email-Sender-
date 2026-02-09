const mongoose = require("mongoose");
const adminschme = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  Role: {
    type: String,
    required: true,
    enum: ["superadmin", "admin", "moderator"],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
    match: [
      /^[a-zA-Z0-9\s.-]+$/,
      "Name can only contain letters, numbers, spaces, periods, and hyphens",
    ],
  },
  password: {
    type: String,
    select: false,
    minlength: [6, "Password must be at least 6 characters"],
    maxlength: [128, "Password cannot exceed 128 characters"],
  },
});
