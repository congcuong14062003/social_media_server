
import multer from "multer";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express from "express";
import { createReactPostById } from "../../controllers/Post/heart_post.controller.js";
import { createNotice, listNoticesByUser } from "../../controllers/Notice/notice.controller.js";
const router = express.Router();
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });
export default function NoticeRouter() {
  router.post("/create-notice", Authentication, Authorization, createNotice);
  router.get("/list-notice/",Authentication, Authorization, listNoticesByUser);
  return router;
}
