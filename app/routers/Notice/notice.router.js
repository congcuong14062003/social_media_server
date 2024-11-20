
import multer from "multer";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express from "express";
import { createReactPostById } from "../../controllers/Post/heart_post.controller.js";
import { createNotice, deleleAllNotice, deleleAllNoticeCurrent, deleteNotice, listNoticesByUser } from "../../controllers/Notice/notice.controller.js";
const router = express.Router();
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });
export default function NoticeRouter() {
  router.post("/create-notice", Authentication, Authorization, createNotice);
  router.delete("/delete-notice/:id", Authentication, Authorization, deleteNotice);
  router.get("/list-notice/",Authentication, Authorization, listNoticesByUser);
  router.delete("/delete-all/",Authentication, Authorization, deleleAllNotice);
  router.post("/delete-notice-current/",Authentication, Authorization, deleleAllNoticeCurrent);
  return router;
}
