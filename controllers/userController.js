const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const mailHelper = require("../utils/mailHelper");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
    if (!req.files) {
        return next(new CustomError("Photo is required for signup", 400));
    }

    const { name, email, password } = req.body;

    if (!email || !name || !password) {
        return next(
            new CustomError("email, name and password is required", 400)
        );
    }

    let file = req.files.photo;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "users",
        width: 150,
        crop: "scale",
    });

    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url,
        },
    });

    cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
    // getting email and password from user
    const { email, password } = req.body;
    if (!email || !password) {
        return next(
            new CustomError("please provide an email and password", 400)
        );
    }

    // check if user exist in database
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new CustomError("you are not registered", 400));
    }

    // check entered password is valid or not
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
        return next(new CustomError("please enter valid password", 400));
    }

    // if everything is correct then send token
    cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "logout successfully",
    });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new CustomError("you are not registered", 400));
    }
    const forgotToken = user.getForgotPasswordToken();

    await user.save({ validateBeforeSave: false });

    const myUrl = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/password/reset/${forgotToken}`;

    const message = `Copy and Paste this link in your url and hit enter \n\n ${myUrl}`;

    try {
        await mailHelper({
            email: email,
            subject: "LCO E-Commerce - Password Reset Email",
            message,
        });

        res.status(200).json({
            success: true,
            message: "email sent successfully",
        });
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpity = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new CustomError(error.message, 500));
    }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;

    const encryptedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: encryptedToken,
        forgotPasswordExpity: {
            $gt: Date.now(),
        },
    });
    if (!user) {
        return next(new CustomError("token is invalid or expired", 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(
            new CustomError("password and confirm password does not match", 400)
        );
    }

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpity = undefined;

    await user.save();

    cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        user,
    });
});

exports.changePassword = BigPromise(async (req, res, next) => {
    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");

    const isCorrectOldPassword = await user.validatePassword(
        req.body.oldPassword
    );
    if (!isCorrectOldPassword) {
        return next(new CustomError("old password in incorrect", 400));
    }

    user.password = req.body.password;

    await user.save();
    cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
    if (!req.body.name || !req.body.email) {
        return next(
            new CustomError("name and email should be there to update", 400)
        );
    }
    const newData = {
        name: req.body.name,
        email: req.body.email,
    };

    if (req.files) {
        const user = await User.findById(req.user.id);
        const imageId = user.photo.id;

        // delete image from cloudinary
        const resp = await cloudinary.uploader.destroy(imageId);
        // upload image to cloudinary
        let file = req.files.photo;
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale",
        });
        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url,
        };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        user,
    });
});

exports.adminAllUsers = BigPromise(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new CustomError("no user found", 400));
    }
    res.status(200).json({
        success: true,
        user,
    });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
    const newData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        user,
    });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new CustomError("no user found", 401));
    }
    const imageId = user.photo.id;
    await cloudinary.uploader.destroy(imageId);
    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "user deleted by admin",
    });
});

exports.managerAllUsers = BigPromise(async (req, res, next) => {
    const users = await User.find({ role: "user" });

    res.status(200).json({
        success: true,
        users,
    });
});
