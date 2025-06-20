const express = require("express");
const {
  getAllProducts,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteReview,
  getAdminProducts,
   getFeaturedProducts,
   getProductFilters ,
} = require("../controllers/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { uploadProductImages } = require("../utils/multer"); // ✅ Import product image uploader

const router = express.Router();

// Public routes
router.route("/products").get(getAllProducts);
router.route("/products/featured").get(getFeaturedProducts);
router.route("/products/filters").get(getProductFilters);
router.route("/product/:id").get(getProductDetails);
router.route("/review").put(isAuthenticatedUser, createProductReview);
router
  .route("/reviews")
  .get(getProductReviews)
  .delete(isAuthenticatedUser, deleteReview);

// Admin routes
router
  .route("/admin/products")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

router
  .route("/admin/product/new")
  .post(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    uploadProductImages, // ✅ Handle multiple product images
    createProduct
  );

router
  .route("/admin/product/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    uploadProductImages, // Optional: allow images on update
    updateProduct
  )
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

module.exports = router;
