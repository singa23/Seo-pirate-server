const { Schema, model } = require("mongoose");

// User model
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    firstName: {
      type: String,
      required: [true, "First name is required."],
    },
  },
  {
    timestamps: true,
  }
);

// Project model
const websitesSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required."],
    },
    url: {
      type: String,
      required: [true, "URL is required."],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
    },
    seodatas: {
      title: String,
      metaDescription: String,
    },
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);
const Websites = model("Websites", websitesSchema);

module.exports = { User, websitesSchema };
