import uploadFile from "../../../configs/cloud/cloudinary.config.js";
import PostComment from "../../models/Post/comment_post.model.js";
import Post from "../../models/Post/post.model.js";
import { ProfileMedia } from "../../models/User/profile_media.model.js";
import { UserProfile } from "../../models/User/user_profile.model.js";
import { Users } from "../../models/User/users.model.js";
import { getInfoProfileUser } from "../User/user.controller.js";

// Viết bình luận
const createCommentPostById = async (req, res) => {
  const post_id = req.params.id;
  const file = req.files?.[0]; // Kiểm tra xem có file không
  const { commenting_user_id, comment_text, media_type } = req.body;

  let media_link = null;

  // Xử lý file tải lên
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
    // Tạo bình luận mới
    const comment = new PostComment({
      post_id,
      commenting_user_id,
      comment_text,
      media_link,
      media_type,
    });

    const createdComment = await comment.create();

    if (createdComment) {
      // Lấy thông tin người dùng (avatar và user_name)
      const userInfo = await Users.getById(commenting_user_id);
      const avatar = await ProfileMedia.getLatestAvatarById(commenting_user_id)
      // Kết hợp thông tin bình luận và người dùng
      const responseComment = {
        ...comment, // Thông tin bình luận
        avatar: avatar || null, // Avatar của người dùng
        commenting_user_name: userInfo?.user_name || null, // Tên người dùng
      };

      return res.status(200).json({ status: true, data: responseComment });
    } else {
      return res
        .status(404)
        .json({ status: false, message: "Failed to create comment" });
    }
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
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

const heartCommentByPost = async (req, res) => {
  const comment_id = req.params.id;

  try {
    const comments = await PostComment.updateCommentHeart(comment_id);

    if (comments) {
      res.status(200).json({ status: true });
    } else {
      res.status(404).json({ status: false });
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

const deleteCommentPost = async (req, res) => {
  try {
    const comment_id = req.params.id;
    const { post_id } = req.body;
    const my_id = req.body.data?.user_id;
    const user_id = (await Post.getPostById(post_id))?.user_id;
    const commenting_user_id = (
      await PostComment.getCommentByCommentId(comment_id)
    )?.commenting_user_id;

    if (my_id === commenting_user_id || my_id === user_id) {
      const result = await PostComment.deleteComment(comment_id);

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

export {
  createCommentPostById,
  listCommentByPost,
  heartCommentByPost,
  deleteCommentPost,
};
