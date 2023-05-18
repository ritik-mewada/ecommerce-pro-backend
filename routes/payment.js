const express = require("express");
const router = express.Router();
const {
    sendStripeKey,
    captureRazorpayPayment,
    captureStripePayment,
    sendRazorpayKey,
} = require("../controllers/paymentControllers");
const { isLoggedIn } = require("../middlewares/userMiddleware");

router.route("/stripekey").get(isLoggedIn, sendStripeKey);
router.route("/razorpaykey").get(isLoggedIn, sendRazorpayKey);

router.route("/capturestripe").post(isLoggedIn, captureStripePayment);
router.route("/capturerazorpay").post(isLoggedIn, captureRazorpayPayment);

module.exports = router;
