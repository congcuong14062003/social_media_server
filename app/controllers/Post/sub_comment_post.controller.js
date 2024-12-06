import uploadFile from "../../../configs/cloud/cloudinary.config";
import PostComment from "../../models/Post/comment_post.model";
import Post from "../../models/Post/post.model";
import SubPostComment from "../../models/Post/sub_comment_post.model";
import { ProfileMedia } from "../../models/User/profile_media.model";
import { Users } from "../../models/User/users.model";

// Tạo bình luận cấp 2
const createSubCommentByCommentId = async (req, res) => {
  const comment_id = req.params.id; // Lấy comment_id từ URL params
  const file = req.files?.[0]; // Kiểm tra xem có file không
  const { replying_user_id, comment_text, media_type } = req.body; // Lấy dữ liệu từ request body

  let media_link = null;

  // Kiểm tra xem comment_id có tồn tại trong cơ sở dữ liệu không
  const comment = await PostComment.getCommentByCommentId(comment_id);
  if (!comment) {
    // Nếu không tìm thấy comment, trả về thông báo lỗi
    return res.status(404).json({ status: false, message: "Bình luận không tồn tại hoặc đã bị xóa" });
  }

  // Xử lý file tải lên (nếu có)
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
    // Khởi tạo đối tượng SubPostComment
    const subComment = new SubPostComment({
      comment_id,
      replying_user_id,
      comment_text,
      media_link, // Có thể là null nếu không có file
      media_type,
    });

    // Tạo sub-comment
    const createdSubComment = await subComment.create();

    if (createdSubComment) {
      // Lấy thông tin người dùng (avatar và user_name)
      const userInfo = await Users.getById(replying_user_id); // Lấy thông tin người dùng
      const avatar = await ProfileMedia.getLatestAvatarById(replying_user_id); // Lấy avatar mới nhất

      // Kết hợp thông tin bình luận và người dùng
      const responseComment = {
        sub_comment_id: subComment.sub_comment_id,
        comment_id: subComment.comment_id,
        replying_user_id: subComment.replying_user_id,
        comment_text: subComment.comment_text,
        media_link: subComment.media_link,
        media_type: subComment.media_type,
        avatar: avatar || null, // Avatar của người dùng
        replying_user_name: userInfo?.user_name || null, // Tên người dùng
      };

      return res.status(200).json({ status: true, data: responseComment });
    } else {
      return res.status(404).json({ status: false, message: "Failed to create sub-comment" });
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
const heartSubCommentByPost = async (req, res) => {
  const sub_comment_id = req.params.id;

  try {
    const comments = await SubPostComment.updateSubCommentHeart(sub_comment_id);

    if (comments) {
      res.status(200).json({ status: true });
    } else {
      res.status(404).json({ status: false});
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};


const deleteSubCommentPost = async (req, res) => {
  try {
    const sub_comment_id = req.params.id;
    const { post_id } = req.body;
    const my_id = req.body.data?.user_id;
    const user_id = (await Post.getPostById(post_id))?.user_id;
    const replying_user_id = (
      await SubPostComment.getBySubCommentId(sub_comment_id)
    )?.replying_user_id;

    if (my_id === replying_user_id || my_id === user_id) {
      const result = await SubPostComment.deleteSubComment(sub_comment_id);

      if (result) {
        return res.status(200).json({ status: true });
      } else {
        return res
          .status(404)
          .json({ status: false, message: "Failed to delete comment" });
      }
    } else {
      return res.status(403).json({
        status: false,
        message: "Bạn không có quyền xóa bình luận này",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

export { createSubCommentByCommentId, getSubCommentsByCommentId, heartSubCommentByPost, deleteSubCommentPost };
