import { v2 as cloudinary } from 'cloudinary';
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// Define the uploadFile function
const uploadFile = async (file, folder) => {
    try {
        // Set up transformation options
        const options = {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1000, crop: "scale" },
                { quality: "auto" },
                { fetch_format: "auto" }
            ]
        };

        // Upload file to Cloudinary using buffer
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    console.error('Error uploading file:', error);
                    return reject(error);
                }
                resolve(result);
            });

            // Converting buffer to stream and piping to Cloudinary
            require('stream').Readable.from(file.buffer).pipe(uploadStream);
        });


        return {
            url: result.secure_url,
            fileType: result.resource_type
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export default uploadFile;
