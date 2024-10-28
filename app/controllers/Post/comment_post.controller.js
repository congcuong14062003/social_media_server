import uploadFile from "../../../configs/cloud/cloudinary.config.js";
import PostComment from "../../models/Post/comment_post.model.js";

// Viết bình luận
const createCommentPostById = async (req, res) => {
  const post_id = req.params.id;
  const file = req.files?.[0]; // Kiểm tra xem có file không
  const { commenting_user_id, comment_text, media_type } = req.body;

  console.log(commenting_user_id, comment_text, media_type);

  let media_link = null; // Đặt mặc định là null

  if (file) {
      try {
          const media_link_url = await uploadFile(file, process.env.NAME_FOLDER_POST);
          media_link = media_link_url?.url;
      } catch (error) {
          console.error("Error uploading file:", error);
          return res.status(500).json({ status: false, message: "File upload failed" });
      }
  }

  try {
      const comment = new PostComment({
          post_id,
          commenting_user_id,
          comment_text,
          media_link, // Sẽ là null nếu không có file
          media_type,
      });

      const result = await comment.create();

      if (result) {
          res.status(200).json({ status: true, data: result });
      } else {
          res.status(404).json({ status: false, message: "Failed to create comment" });
      }
  } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ status: false, message: "An error occurred, please try again later" });
  }
};

// Lấy danh sách bình luận và sub-comment theo post_id
const listCommentByPost = async (req, res) => {
  const post_id = req.params.id;

  try {
    const comments = await PostComment.getCommentsWithSubComments(post_id);

    if (comments.length > 0) {
      res.status(200).json({ status: true, data: comments });
    } else {
      res.status(404).json({ status: false, data: [] });
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

export { createCommentPostById, listCommentByPost };
