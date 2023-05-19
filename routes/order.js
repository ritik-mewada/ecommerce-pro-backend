const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/userMiddleware");
const {
    createOrder,
    getOneOrder,
    getLoggedInOrders,
    adminGetAllOrders,
    adminUpdateOrder,
    adminDeleteOneOrder,
} = require("../controllers/orderControllers");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/:id").get(isLoggedIn, getOneOrder);
router.route("/myOrder").get(isLoggedIn, getLoggedInOrders);

//  admin only routes
router
    .route("/admin/orders")
    .get(isLoggedIn, customRole("admin"), adminGetAllOrders);
router
    .route("/admin/order/:id")
    .put(isLoggedIn, customRole("admin"), adminUpdateOrder)
    .delete(isLoggedIn, customRole("admin"), adminDeleteOneOrder);

module.exports = router;
