const Order = require("../models/order");
const Product = require("../models/product");
const BigPromist = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");

exports.createOrder = BigPromist(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        taxAmount,
        shippingAmount,
        totalAmount,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        taxAmount,
        shippingAmount,
        totalAmount,
        user: req.user._id,
    });

    res.status(200).json({
        success: true,
        order,
    });
});

exports.getOneOrder = BigPromist(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        return next(new CustomError("please check order id", 401));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

exports.getLoggedInOrders = BigPromist(async (req, res, next) => {
    const order = await Order.find({ user: req.user._id });

    if (!order) {
        return next(new CustomError("please check order id", 401));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

exports.adminGetAllOrders = BigPromist(async (req, res, next) => {
    const orders = await Order.find();

    res.status(200).json({
        success: true,
        orders,
    });
});

exports.adminUpdateOrder = BigPromist(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (order.orderStatus === "delivered") {
        return next(
            new CustomError("order is already marked as delivered", 401)
        );
    }

    order.orderStatus = req.body.orderStatus;

    order.orderItems.forEach(async (prod) => {
        await updateProductStock(prod.product, prod.quantity);
    });

    await order.save();

    res.status(200).json({
        success: true,
        orders,
    });
});

exports.adminDeleteOneOrder = BigPromist(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    await order.deleteOne();

    res.status(200).json({
        success: true,
    });
});

async function updateProductStock(productId, quantity) {
    const product = await Product.findById(productId);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false });
}
