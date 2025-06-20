const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter the product name"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Please Enter the product Description"]
  },
  price: {
    type: Number,
    required: [true, "Please Enter the product price"],
    max: [99999999, "Price cannot exceed 8 digits"],
    min: [0, "Price cannot be negative"]
  },
  ratings: {
    type: Number,
    default: 0
  },
  images: [
    {
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  ],
  category: {
    type: String,
    required: [true, "Please Enter product category"]
  },
  brand: {
  type: String,
  required: [true, "Please enter product brand"]
},
  tags: {
  type: [String],
  default: []
},
  stock: {
    type: Number,
    required: [true, "Please Enter product Stock"],
    max: [9999, "Stock cannot exceed 4 digits"],
    min: [0, "Stock cannot be negative"],
    default: 1
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true
      },
      comment: {
        type: String,
        required: true
      }
    }
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  isFeatured: {
    type: Boolean,
    default: false // Products are not featured by default
  },
  status: {
  type: String,
  enum: ["Active", "Inactive", "Out of Stock"],
  default: "Active"
},
},
{
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Full-text search support
productSchema.index({ name: "text", description: "text", category: 1 });

module.exports = mongoose.model("Product", productSchema);
