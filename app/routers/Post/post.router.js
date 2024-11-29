import multer from "multer";
import {
  createCommentPostById,
  deleteCommentPost,
  heartCommentByPost,
  listCommentByPost,
} from "../../controllers/Post/comment_post.controller.js";
import {
  createPost,
  deletePost,
  deleteReactByUserID,
  editPost,
  getPostById,
  listPost,
  listPostById,
} from "../../controllers/Post/post.controller.js";
import { createSubCommentByCommentId, deleteSubCommentPost, heartSubCommentByPost } from "../../controllers/Post/sub_comment_post.controller.js";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express from "express";
import { createReactPostById } from "../../controllers/Post/heart_post.controller.js";
const router = express.Router();
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });
export default function PostRouter() {
  router.post(
    "/create-post",
    upload.array("file", 10),
    Authentication,
    Authorization,
    createPost
  );
  router.delete("/delete-post/:id", Authentication, Authorization, deletePost);
  router.post(
    "/edit-post/:id",
    upload.array("file", 10),
    Authentication,
    Authorization,
    editPost
  );
  router.get("/list-post", Authentication, Authorization, listPost);
  router.get("/post-detail/:id", Authentication, Authorization, getPostById);
  router.get(
    "/list-post-by-user/:id",
    Authentication,
    Authorization,
    listPostById
  );
  router.post(
    "/create-comment-post/:id",
    upload.array("file", 1),
    Authentication,
    Authorization,
    createCommentPostById
  );
  router.post(
    "/create-react-post/:id",
    Authentication,
    Authorization,
    createReactPostById
  );
  router.get(
    "/list-comment-post/:id",
    Authentication,
    Authorization,
    listCommentByPost
  );
  router.post(
    "/create-sub-comment-post/:id",
    upload.array("file", 1),
    Authentication,
    Authorization,
    createSubCommentByCommentId
  );
  router.delete(
    "/delete-react-post/:id",
    Authentication,
    Authorization,
    deleteReactByUserID
  );
  router.post(
    "/heart-comment/:id",
    Authentication,
    Authorization,
    heartCommentByPost
  );

  router.post(
    "/heart-sub-comment/:id",
    Authentication,
    Authorization,
    heartSubCommentByPost
  );

  router.post(
    "/delete-comment/:id",
    Authentication,
    Authorization,
    deleteCommentPost
  );

  router.post(
    "/delete-sub-comment/:id",
    Authentication,
    Authorization,
    deleteSubCommentPost
  );

  return router;
}
