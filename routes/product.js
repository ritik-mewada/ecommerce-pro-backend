const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/userMiddleware");
const {
    addProduct,
    getAllProducts,
    adminGetAllProducts,
    getOneProduct,
    adminUpdateOneProduct,
    adminDeleteOneProduct,
    addReview,
    deleteReview,
    getOnlyReviewsForOneProduct,
} = require("../controllers/productController");

// user routes
router.route("/products").get(getAllProducts);
router.route("/product/:id").get(getOneProduct);

// review routes
router.route("/review").put(isLoggedIn, addReview);
router.route("/review").delete(isLoggedIn, deleteReview);
router.route("/reviews").get(isLoggedIn, getOnlyReviewsForOneProduct);

// admin routes
router
    .route("/admin/product/add")
    .post(isLoggedIn, customRole("admin"), addProduct);
router
    .route("/admin/products")
    .get(isLoggedIn, customRole("admin"), adminGetAllProducts);
router
    .route("/admin/product/:id")
    .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
    .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);
module.exports = router;
