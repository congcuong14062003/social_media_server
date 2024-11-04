import { v2 as cloudinary } from "cloudinary";
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadFile = async (file, folder) => {
  try {
    const mimeType = file.mimetype;
    let resourceType = "auto";

    if (
      !mimeType.startsWith("image/") &&
      !mimeType.startsWith("video/") &&
      !mimeType.startsWith("application/pdf")
    ) {
      resourceType = "raw";
    }

    const options = {
      folder: folder,
      resource_type: resourceType,
      public_id: file.originalname, // Lấy tên gốc không đuôi mở rộng
      ...(resourceType === "auto" && {
        transformation: [
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      }),
    };

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            console.error("Error uploading file:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      require("stream").Readable.from(file.buffer).pipe(uploadStream);
    });

    return {
      url: result.secure_url,
      fileType: result.resource_type,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};


export default uploadFile;
