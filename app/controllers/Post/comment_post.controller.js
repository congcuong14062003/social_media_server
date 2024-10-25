import PostComment from "../../models/Post/comment_post.model.js";

// Viết bình luận
const createCommentPostById = async (req, res) => {
  const post_id = req.params.id;
  const { commenting_user_id, comment_text, media_link } = req.body;


  if (!commenting_user_id || !comment_text) {
    return res.status(400).json({ status: false, message: "Missing required fields" });
  }

  try {
    const comment = new PostComment({
      post_id,
      commenting_user_id,
      comment_text,
      media_link,
    });

    const result = await comment.create();

    if (result) {
      res.status(200).json({ status: true, data: result });
    } else {
      res.status(404).json({ status: false, message: "Failed to create comment" });
    }
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
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
