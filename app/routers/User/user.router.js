import { generateKeyPair } from "crypto";
import {
  createUsersBySocialAccount,
  findAllUser,
  getInfoProfileUser,
  getUserById,
  updateUserPassword,
  uploadInfoProfileUser,
  userLogin,
  userLogout,
  userSignup,
} from "../../controllers/User/user.controller.js";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express, { Router } from "express";
import multer from "multer";
import { getUserSettingById, updateUserSetting } from "../../controllers/User/user_setting.controller.js";
import { createUserFaceData, deleteUserFaceData, getAllUserFaceData, getUserFaceDataById, loginUserFaceData } from "../../controllers/User/user_face_recognition.controller.js";
const router = express.Router();
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });
export default function UserRouter(router = Router()) {
  router.post("/signup", userSignup);
  router.post("/social-network/signup", createUsersBySocialAccount); // Đăng ký bằng tài khoản mạng xã hội
  router.post("/login", Authentication, userLogin);
  router.delete("/logout", userLogout);
  router.put("/reset-password", updateUserPassword); // Đổi password

  //setting users
  router.put(
    "/update-setting",
    Authentication,
    Authorization,
    updateUserSetting
  );
  router.get('/get-setting',Authentication, Authorization, getUserSettingById); 
  // face user
  router.post(
    "/login-face-recognition",
    Authentication,
    Authorization,
    loginUserFaceData
  );
  // Handle multiple images with field name 'images_face_recognition'
  router.post(
    "/create-face-recognition/",
    upload.fields([{ name: "images_face_recognition", maxCount: 10 }]),
    Authentication,
    Authorization,
    createUserFaceData
  );
  router.get(
    "/get-face-recognition/",
    Authentication,
    Authorization,
    getUserFaceDataById
  );
  router.get("/get-all-face-recognition", getAllUserFaceData);
  router.delete(
    "/delete-face-recognition/",
    Authentication,
    Authorization,
    deleteUserFaceData
  );


  //infor user
  router.get(
    "/info-profile/",
    Authentication,
    Authorization,
    getInfoProfileUser
  );
  router.get(
    "/info-profile/:id",
    Authentication,
    Authorization,
    getInfoProfileUser
  );
  router.put(
    "/update-profile",
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "cover", maxCount: 1 },
    ]),
    Authentication,
    Authorization,
    uploadInfoProfileUser
  );


  router.get("/all-user", Authentication, Authorization, findAllUser);

  router.get("/is-existed/:id", getUserById);

  return router;
}
