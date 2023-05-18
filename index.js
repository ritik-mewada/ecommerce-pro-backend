const app = require("./app");
const connectWithDb = require("./config/db");
const cloudinary = require("cloudinary").v2;

// connect with the database
connectWithDb();

//cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port: ${process.env.PORT}`);
});

// Configuration
