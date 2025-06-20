const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const sendEmail = require("../utils/sendEmail");
const AdminLog = require("../models/adminLogModel");
const logUserActivity = require("../utils/logUserActivity");

// Utility to compare fields and log differences
function getChangedFields(original, updated) {
  const changes = [];
  for (let key in updated) {
    if (
      key !== "images" &&
      typeof updated[key] !== "object" &&
      original[key] !== updated[key]
    ) {
      changes.push(key);
    }
  }
  return changes;
}

// Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler("Please upload at least one image", 400));
  }

  const imagesLinks = [];

  for (const file of req.files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      await fs.unlink(file.path);
    } catch (err) {
      await fs.unlink(file.path).catch(() => {});
      return next(new ErrorHandler("Cloudinary upload error", 500));
    }
  }

  const productData = {
    ...req.body,
    isFeatured: req.body.isFeatured === "true",
    tags: req.body.tags ? req.body.tags.split(",") : [],
    images: imagesLinks,
    user: req.user.id,
  };

  const product = await Product.create(productData);

  await AdminLog.create({
    type: "CREATE_PRODUCT",
    productId: product._id,
    productName: product.name,
    message: `Product created by admin.`,
    triggeredBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// Get All Products
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 5;
  const productsCount = await Product.countDocuments();

  const priceStats = await Product.aggregate([
    {
      $group: {
        _id: null,
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ]);

  const minPrice = priceStats[0]?.minPrice || 0;
  const maxPrice = priceStats[0]?.maxPrice || 0;

  const queryObj = {};
  if (!req.query.status) {
    queryObj.status = "Active";
  }

  const apiFeature = new ApiFeatures(Product.find(queryObj), req.query)
    .search()
    .filter();

  const filteredProducts = await apiFeature.query.clone();
  const filteredProductsCount = filteredProducts.length;

  apiFeature.pagination(resultPerPage);

  const products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
    minPrice,
    maxPrice,
  });
});

// Get Product Filters
exports.getProductFilters = async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    const statuses = await Product.distinct("status");
    const tags = await Product.distinct("tags");

    res.status(200).json({
      success: true,
      brands,
      statuses,
      tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Featured Products
exports.getFeaturedProducts = catchAsyncErrors(async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true });

  res.status(200).json({
    success: true,
    products: featuredProducts,
  });
});

// Get All Products -- Admin
exports.getAdminProducts = catchAsyncErrors(async (req, res) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const originalProduct = product.toObject();

  if (req.files && req.files.length > 0) {
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    const imagesLinks = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });
      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
      await fs.unlink(file.path).catch(() => {});
    }

    req.body.images = imagesLinks;

    await AdminLog.create({
      type: "UPDATE_PRODUCT",
      productId: product._id,
      productName: product.name,
      message: `Product images updated by admin.`,
      triggeredBy: req.user._id,
    });
  }

  if (req.body.isFeatured !== undefined) {
    req.body.isFeatured = req.body.isFeatured === "true";
  }

  if (req.body.tags) {
    req.body.tags = req.body.tags.split(",");
  }

  Object.assign(product, req.body);

  if (req.body.stock !== undefined) {
    const newStock = Math.max(parseInt(req.body.stock), 0);
    const previousStatus = product.status;

    product.stock = newStock;

    if (newStock === 0 && previousStatus !== "Out of Stock") {
      product.status = "Out of Stock";

      await sendEmail({
        email: process.env.ADMIN_EMAIL,
        subject: `🚨 Product Out of Stock: ${product.name}`,
        message: `The product "${product.name}" (ID: ${product._id}) is now out of stock due to admin update.`,
      });

      await AdminLog.create({
        type: "OUT_OF_STOCK",
        productId: product._id,
        productName: product.name,
        message: `Product manually updated to stock 0 by admin.`,
        triggeredBy: req.user._id,
      });
    } else if (newStock > 0 && previousStatus === "Out of Stock") {
      product.status = "Active";

      await AdminLog.create({
        type: "RESTOCKED",
        productId: product._id,
        productName: product.name,
        message: `Product manually restocked by admin.`,
        triggeredBy: req.user._id,
      });
    }
  }

  const updatedFields = getChangedFields(originalProduct, req.body);

  await product.save({ validateBeforeSave: false });

  await AdminLog.create({
    type: "UPDATE_PRODUCT",
    productId: product._id,
    productName: product.name,
    message:
      updatedFields.length > 0
        ? `Product fields updated: ${updatedFields.join(", ")} by admin.`
        : `Product updated with no field-level changes.`,
    triggeredBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product -- Admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.uploader.destroy(product.images[i].public_id);
  }

  await product.deleteOne();

  await AdminLog.create({
    type: "DELETE_PRODUCT",
    productId: product._id,
    productName: product.name,
    message: `Product deleted by admin.`,
    triggeredBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Create or Update Review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);
  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  let actionMessage = "";

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
    actionMessage = "Review updated";
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
    actionMessage = "Review added";
  }

  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;
  await product.save({ validateBeforeSave: false });

  await logUserActivity(
    req.user._id,
    "SUBMIT_REVIEW",
    `${actionMessage} for product "${product.name}"`,
    req
  );

  res.status(200).json({ success: true });
});

// Get Reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });
  const ratings = avg / reviews.length || 0;

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, ratings, numOfReviews },
    { new: true, runValidators: true }
  );

  await logUserActivity(
    req.user._id,
    "DELETE_REVIEW",
    `Deleted review for product "${product.name}"`,
    req
  );

  res.status(200).json({
    success: true,
  });
});