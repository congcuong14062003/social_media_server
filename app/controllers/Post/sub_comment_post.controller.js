import SubPostComment from "../../models/Post/sub_comment_post.model";

// Tạo bình luận cấp 2
const createSubCommentByCommentId = async (req, res) => {
  const comment_id = req.params.id; // Lấy comment_id từ URL params
  const { replying_user_id, comment_text, media_link } = req.body; // Lấy dữ liệu từ request body

  console.log("Request body:", req.body);

  // Kiểm tra các trường bắt buộc
  if (!replying_user_id || !comment_text) {
    return res.status(400).json({
      status: false,
      message: "Missing required fields",
    });
  }

  try {
    // Khởi tạo đối tượng SubPostComment với dữ liệu nhận được
    const subComment = new SubPostComment({
      comment_id,
      replying_user_id,
      comment_text,
      media_link,
    });

    // Gọi phương thức tạo bình luận
    const result = await subComment.create();

    if (result) {
      res.status(200).json({ status: true, data: result });
    } else {
      res.status(404).json({ status: false, message: "Comment not created" });
    }
  } catch (error) {
    console.error("Error creating sub-comment:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

// Lấy danh sách các bình luận cấp 2 theo comment_id
const getSubCommentsByCommentId = async (req, res) => {
  const comment_id = req.params.id; // Lấy comment_id từ URL params

  try {
    const subComments = await SubPostComment.getByCommentId(comment_id);

    if (subComments.length > 0) {
      res.status(200).json({ status: true, data: subComments });
    } else {
      res.status(404).json({ status: false, message: "No sub-comments found" });
    }
  } catch (error) {
    console.error("Error fetching sub-comments:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

export { createSubCommentByCommentId, getSubCommentsByCommentId };
