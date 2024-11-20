import uploadFile from "../../../configs/cloud/cloudinary.config";
import SubPostComment from "../../models/Post/sub_comment_post.model";

// Tạo bình luận cấp 2
const createSubCommentByCommentId = async (req, res) => {
  const comment_id = req.params.id; // Lấy comment_id từ URL params
  
  const file = req.files?.[0]; // Kiểm tra xem có file không
  const { replying_user_id, comment_text, media_type } = req.body; // Lấy dữ liệu từ request body

  let media_link = null; // Đặt mặc định là null

  if (file) {
    try {
      const media_link_url = await uploadFile(
        file,
        process.env.NAME_FOLDER_POST
      );
      media_link = media_link_url?.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      return res
        .status(500)
        .json({ status: false, message: "File upload failed" });
    }
  }

  try {
    // Khởi tạo đối tượng SubPostComment
    const subComment = new SubPostComment({
      comment_id,
      replying_user_id,
      comment_text,
      media_link, // Có thể là null nếu không có file
      media_type,
    });

    // Tạo sub-comment
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
