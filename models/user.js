const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwtToken = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please provide a name"],
        maxLength: [40, "name should be under 40 chars"],
    },
    email: {
        type: String,
        required: [true, "please provide an email"],
        validate: [validator.isEmail, "please enter valid email"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "please provide a password"],
        minLength: [6, "password should be atleast 6 chars"],
        select: false,
    },
    role: {
        type: String,
        enum: ["user", "admin", "manager"],
        default: "user",
    },
    photo: {
        id: {
            type: String,
            // required: true,
        },
        secure_url: {
            type: String,
            // required: true,
        },
    },
    forgotPasswordToken: String,
    forgotPasswordExpity: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// encrypt password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // check if password is modified
    this.password = await bcrypt.hash(this.password, 10);
});

// validate password
userSchema.methods.validatePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

// create jwt token
userSchema.methods.getJwtToken = function () {
    return jwtToken.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
};

// generate forgot password token
userSchema.methods.getForgotPasswordToken = function () {
    // generate long and a random string
    const forgotToken = crypto.randomBytes(20).toString("hex");

    // getting hash
    this.forgotPasswordToken = crypto
        .createHash("sha256")
        .update(forgotToken)
        .digest("hex");

    this.forgotPasswordExpity = Date.now() + 20 * 60 * 1000;

    return forgotToken;
};

module.exports = mongoose.model("User", userSchema);
