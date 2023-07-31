const { Schema, model } = require("mongoose");

const websiteSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Website name is required."],
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
      title: [String],
      description: [String],
      h1: [String],
      h2: [String],
      h3: [String],
      h4: [String],
      h5: [String],
      h6: [String],
      robots: [String],
      links: [String],
      canonical: [String],
      alternateMobile: [String],
      prevPagination: [String],
      nextPagination: [String],
      amp: [String],
      hreflang: [String],
    },
  },
  {
    timestamps: true,
  }
);
const Website = model("Website", websiteSchema);

module.exports = Website;
