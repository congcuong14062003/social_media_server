import uploadFile from "../../../configs/cloud/cloudinary.config";
import { UserFaceData } from "../../models/User/user_face_recognition.model";
import { Users } from "../../models/User/users.model";
import {
  decryptAESSame,
  encryptAES,
  encryptAESSame,
} from "../../ultils/crypto";
require("dotenv").config();
// Create user face data

const createUserFaceData = async (req, res) => {
  try {
    if (!req.files || req.files?.images_face_recognition?.length === 0) {
      return res
        .status(400)
        .json({ status: false, message: "No files uploaded" });
    }

    // Thư mục lưu trữ ảnh trên Cloudinary
    const folder = process.env.NAME_FOLDER_USER_FACE_RECOGNITION;

    // Upload tất cả các ảnh lên Cloudinary
    const uploadPromises = req.files?.images_face_recognition.map((file) =>
      uploadFile(file, folder)
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Tạo đối tượng UserFaceData và lưu từng liên kết ảnh vào cơ sở dữ liệu
    const userIdEncode = encryptAESSame(req.body?.data?.user_id);

    const createPromises = uploadResults.map((result) => {
      const userFaceData = new UserFaceData({
        user_id_encode: userIdEncode,
        media_link: result.url,
      });
      return userFaceData.create();
    });

    const results = await Promise.all(createPromises);
    // Kiểm tra số lượng ảnh đã được lưu thành công
    const successfulSaves = results.filter((result) => result === 1).length;

    if (successfulSaves) {
      // Phản hồi thành công
      res.status(201).json({
        status: true,
        message: `Thu thập dữ liệu khuôn mặt thành công`,
      });
    }
  } catch (error) {
    console.log("Error in createUserFaceData:", error);
    res.status(400).json({ status: false, message: error.message ?? error });
  }
};

// Get user face data by ID
const getUserFaceDataById = async (req, res) => {
  try {
    const userFaceData = await UserFaceData.getById(
      encryptAESSame(req.body?.data?.user_id)
    );
    if (userFaceData) {
      res.status(200).json({ status: true, data: userFaceData });
    } else {
      res
        .status(404)
        .json({ status: false, message: "User face data not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message ?? error });
  }
};

// Get user face data by ID
const getAllUserFaceDataByUserIDEncode = async (req, res) => {
  try {
    const { user_email, type_account } = req?.body;
    if (!user_email || !user_email) {
      return res
        .status(404)
        .json({ status: false, message: "Vui lòng nhập đầy đủ thông tin" });
    }
    const id = await Users.getIdByEmail(user_email, type_account);
    console.log(id);

    let idEncode;
    if (id?.user_id) {
      idEncode = await encryptAESSame(id?.user_id);
    } else {
      return res.status(404).json({
        status: false,
        message: "Tài khoản không tồn tại hoặc chưa thiết lập nhận diện",
      });
    }
    const userFaceData = await UserFaceData.getById(idEncode);
    if (userFaceData) {
      res.status(200).json({ status: true, data: userFaceData });
    } else {
      res.status(404).json({
        status: false,
        message: "Tài khoản không tồn tại hoặc chưa thiết lập nhận diện",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message ?? error });
  }
};

// Get user face data by ID
const loginUserFaceData = async (req, res) => {
  try {
    const user = await Users.getById(req.body?.data?.user_id);

    if (user?.user_id) {
      res.status(200).json({ status: true });
    } else {
      res
        .status(404)
        .json({ status: false, message: "User face data not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message ?? error });
  }
};

// Delete user face data
const deleteUserFaceData = async (req, res) => {
  try {
    const result = await UserFaceData.delete(
      encryptAESSame(req.body?.data?.user_id)
    );
    if (result > 0) {
      res.status(200).json({
        status: true,
        message: "Dữ liệu khuôn mặt người dùng đã bị xóa",
      });
    } else {
      res
        .status(400)
        .json({ status: false, message: "Error deleting user face data" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message ?? error });
  }
};

export {
  createUserFaceData,
  getUserFaceDataById,
  getAllUserFaceDataByUserIDEncode,
  deleteUserFaceData,
  loginUserFaceData,
};
