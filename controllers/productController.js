const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const WhereClause = require("../utils/whereClause");
const cloudinary = require("cloudinary").v2;

exports.addProduct = BigPromise(async (req, res, next) => {
    let imageArray = [];

    if (!req.files) {
        return next(new CustomError("images are required", 401));
    }
    // adding images to cloudinary
    if (req.files) {
        for (let index = 0; index < req.files.photos.length; index++) {
            const result = await cloudinary.uploader.upload(
                req.files.photos[index].tempFilePath,
                {
                    folder: "products",
                }
            );
            imageArray.push({
                id: result.public_id,
                secure_url: result.secure_url,
            });
        }
    }

    req.body.photos = imageArray;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(200).json({
        success: true,
        product,
    });
});

exports.getAllProducts = BigPromise(async (req, res, next) => {
    let resultPerPage = 6;

    const totalCountProduct = await Product.countDocuments();
    const productsObj = new WhereClause(Product.find(), req.query)
        .search()
        .filter();

    let products = await productsObj.base;
    const filteredProductNumber = products.length;

    productsObj.pager(resultPerPage);
    products = await productsObj.base.clone();

    res.status(200).json({
        success: true,
        products,
        totalCountProduct,
        filteredProductNumber,
    });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new CustomError("no product found with this id", 401));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new CustomError("no product found with this id", 401));
    }
    let imagesArray = [];

    if (req.files) {
        for (let index = 0; index < product.photos.length; index++) {
            const res = await cloudinary.uploader.destroy(
                product.photos[index].id
            );
        }

        for (let index = 0; index < req.files.photos.length; index++) {
            const result = await cloudinary.uploader.upload(
                req.files.photos[index].tempFilePath,
                {
                    folder: "products",
                }
            );
            imagesArray.push({
                id: result.public_id,
                secure_url: result.secure_url,
            });
        }
    }

    req.body.photos = imagesArray;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        product,
    });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new CustomError("no product found with this id", 401));
    }

    for (let index = 0; index < product.photos.length; index++) {
        const res = await cloudinary.uploader.destroy(product.photos[index].id);
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "product was deleted!!!",
    });
});
