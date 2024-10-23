
import multer from "multer";
import { createCommentPostById, listCommentByPost } from "../../controllers/Post/comment_post.controller.js";
import { createPost, deletePost, deleteReactByUserID, listPost, listPostById } from "../../controllers/Post/post.controller.js";
import { createSubCommentByCommentId } from "../../controllers/Post/sub_comment_post.controller.js";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express from "express";
import { createReactPostById } from "../../controllers/Post/heart_post.controller.js";
import { createStory, listStory, storyById } from "../../controllers/Story/story.controller.js";
const router = express.Router();
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });
export default function StoryRouter() {
  router.post("/create-story",upload.array("content", 1), Authentication, Authorization, createStory);
  router.get("/list-story", Authentication, Authorization, listStory);
  router.get("/story-by-id/:id", Authentication, Authorization, storyById);
  return router;
}
