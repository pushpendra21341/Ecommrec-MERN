const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendEmail = require("../utils/sendEmail");
const AdminLog = require("../models/adminLogModel");

// ------------------ CREATE ORDER (User) ------------------
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// ------------------ GET SINGLE ORDER ------------------
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// ------------------ USER: MY ORDERS ------------------
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// ------------------ ADMIN: GET ALL ORDERS ------------------
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  // ✅ Log
  await AdminLog.create({
    action: "View All Orders",
    message: "Admin viewed all orders.",
    triggeredBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// ------------------ ADMIN: UPDATE ORDER STATUS ------------------
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  // Update stock
  for (const item of order.orderItems) {
    await updateStock(item.product, item.quantity, req.user._id);
  }

  // Update order status
  const prevStatus = order.orderStatus;
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  // ✅ Log
  await AdminLog.create({
    action: "Update Order Status",
    orderId: order._id,
    message: `Order status changed from "${prevStatus}" to "${order.orderStatus}".`,
    triggeredBy: req.user._id,
  });

  res.status(200).json({ success: true });
});

// ------------------ STOCK UPDATE FUNCTION ------------------
const updateStock = async (productId, quantity, userId = null) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product not found with ID: ${productId}`);
  }

  const previousStock = product.stock;
  product.stock = Math.max(product.stock - quantity, 0);

  if (product.stock === 0 && product.status !== "Out of Stock") {
    product.status = "Out of Stock";

    // 📧 Email
    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: `🚨 Product Out of Stock: ${product.name}`,
      message: `The product "${product.name}" (ID: ${product._id}) is now out of stock after an order.`,
    });

    // ✅ Log
    await AdminLog.create({
      action: "Product Out of Stock",
      type: "OUT_OF_STOCK",
      productId: product._id,
      productName: product.name,
      message: `Product went out of stock after order.`,
      triggeredBy: userId,
    });
  } else if (product.stock > 0 && product.status === "Out of Stock" && previousStock === 0) {
    product.status = "Active";
  }

  await product.save({ validateBeforeSave: false });
};

// ------------------ ADMIN: DELETE ORDER ------------------
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this ID", 404));
  }

  for (const item of order.orderItems) {
    await restoreStock(item.product, item.quantity);
  }

  await order.deleteOne();

  // ✅ Log
  await AdminLog.create({
    action: "Delete Order",
    orderId: order._id,
    message: `Order deleted by admin.`,
    triggeredBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// ------------------ RESTORE STOCK ------------------
const restoreStock = async (productId, quantity) => {
  const product = await Product.findById(productId);

  if (product) {
    product.stock += quantity;
    await product.save({ validateBeforeSave: false });
  }
};