
import { createPost, listPost } from "../../controllers/Post/post.controller.js";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express from "express";
const router = express.Router();
export default function PostRouter() {
  router.post("/create-post", Authentication, Authorization, createPost);
  router.get("/list-post",Authentication, Authorization, listPost);

  return router;
}
