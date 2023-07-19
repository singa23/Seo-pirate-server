const { Schema, model } = require("mongoose");

// Project model

const websiteSchema = new Schema(
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
const Website = model("Website", websiteSchema);

module.exports = Website;
