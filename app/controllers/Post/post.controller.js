import uploadFile from "../../../configs/cloud/cloudinary.config";
import pool from "../../../configs/database/database";
import GroupChannel from "../../models/Group/group_channel.model";
import GroupPost from "../../models/Group/group_post.model";
import Post from "../../models/Post/post.model";
import PostMedia from "../../models/Post/post_media.model";
import PostReact from "../../models/Post/post_react.model";
import { Users } from "../../models/User/users.model";

// tạo bài viết
const createPost = async (req, res) => {
  try {
    const files = req.files || [];
    const { user_id, post_privacy, react_emoji } = req.body;
    let post_text = req.body?.post_text ?? "";

    // Tạo instance của Post
    const post = new Post({
      user_id,
      post_privacy,
      post_text,
      react_emoji: react_emoji || null,
    });

    // Thực hiện tạo bài viết
    const result = await post.create();

    if (!result) {
      return res
        .status(400)
        .json({ status: false, message: "Không thể tạo bài viết" });
    }

    const postId = post.post_id; // Lấy post_id

    // Xử lý tải media nếu có tệp
    if (files.length > 0) {
      for (const file of files) {
        const mediaUrl = await uploadFile(file, process.env.NAME_FOLDER_POST);

        // Kiểm tra mediaUrl
        if (!mediaUrl || !mediaUrl.url) {
          console.error("Media upload failed for file:", file.originalname);
          continue; // Bỏ qua nếu không tải được
        }

        // Xác định loại tệp dựa trên phần mở rộng hoặc loại MIME
        const fileExtension = file.originalname.split(".").pop().toLowerCase();
        let mediaType = null;

        if (file.mimetype.startsWith("image/")) {
          mediaType = "image"; // Nếu là hình ảnh
        } else if (file.mimetype.startsWith("video/")) {
          mediaType = "video"; // Nếu là video
        } else {
          console.error("Unsupported file type:", file.mimetype);
          continue; // Bỏ qua nếu loại tệp không được hỗ trợ
        }

        // Tạo thể hiện PostMedia
        const media = new PostMedia({
          post_id: postId,
          media_type: mediaType, // Gán media_type dựa trên kiểm tra
          media_link: mediaUrl.url, // Gán media_link
        });

        // Kiểm tra giá trị trước khi lưu
        if (!postId || !mediaType || !mediaUrl.url) {
          console.error("Missing parameters for media:", {
            postId,
            mediaType,
            mediaUrl,
          });
          continue; // Bỏ qua nếu thiếu tham số
        }

        // Lưu mỗi thể hiện media
        await media.create();
      }
    }

    res
      .status(200)
      .json({
        status: true,
        message: "Bài viết đã được tạo thành công",
        post_id: postId,
      });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};
// cập nhật bài viết
const editPost = async (req, res) => {
  try {
    const files = req.files || [];
    const post_id = req.params.id;
    const { user_id, post_privacy, react_emoji, is_media_changed } = req.body;
    let post_text = req.body?.post_text ?? "";

    // Kiểm tra bài viết tồn tại không
    const existingPost = await Post.getPostById(post_id);
    if (!existingPost) {
      return res
        .status(404)
        .json({ status: false, message: "Bài viết không tồn tại" });
    }

    // Tạo instance của Post
    const post = new Post({
      post_id,
      user_id: existingPost.user_id, // Không cho phép thay đổi user_id
      post_privacy: post_privacy ?? existingPost.post_privacy,
      post_text: post_text ?? existingPost.post_text,
      react_emoji: react_emoji ?? existingPost.react_emoji,
    });

    // Cập nhật bài viết
    const updateResult = await post.update();
    if (!updateResult) {
      return res
        .status(400)
        .json({ status: false, message: "Không thể cập nhật bài viết" });
    }

    // Xử lý media nếu có tệp tải lên mới
    // if (files.length > 0) {
    // Xóa media cũ liên quan đến bài viết
    console.log(">>>>:", is_media_changed);

    if (is_media_changed == "true") {
      console.log("123231232323");

      await pool.execute(`DELETE FROM PostMedia WHERE post_id = ?`, [post_id]);

      for (const file of files) {
        const mediaUrl = await uploadFile(file, process.env.NAME_FOLDER_POST);

        if (!mediaUrl || !mediaUrl.url) {
          console.error("Không thể tải lên media:", file.originalname);
          continue; // Bỏ qua nếu media không tải được
        }

        const mediaType = file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.startsWith("video/")
          ? "video"
          : null;

        if (!mediaType) {
          console.error("Loại tệp không được hỗ trợ:", file.mimetype);
          continue;
        }

        // Tạo mới media cho bài viết
        const media = new PostMedia({
          post_id,
          media_type: mediaType,
          media_link: mediaUrl.url,
        });

        await media.create();
      }
    }
    res
      .status(200)
      .json({ status: true, message: "Bài viết đã được cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};

const deletePost = async (req, res) => {
  const post_id = req?.params?.id;

  try {
    // Kiểm tra bài viết có tồn tại không
    const post = await Post.getPostById(post_id);
    if (!post) {
      return res
        .status(404)
        .json({ status: false, message: "Bài viết không tồn tại" });
    }
    // Xoá bài viết khỏi database
    await Post.deleteById(post_id);

    res
      .status(200)
      .json({ status: true, message: "Bài viết đã được xoá thành công" });
  } catch (error) {
    console.error("Lỗi khi xoá bài viết:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};

const listPost = async (req, res) => {
  const my_id = req.body?.data?.user_id ?? null;
  try {
    // Lấy tất cả bài viết với thông tin người dùng
    const posts = await Post.getAllPosts(my_id);

    // Nếu không có bài viết, trả về phản hồi 404
    if (posts.length === 0) {
      return res.status(404).json({ status: false });
    }

    // Lấy tất cả media cho từng bài viết
    const mediaPromises = posts.map(async (post) => {
      const postGroup = await GroupPost.getGroupPostAcceptedByPostId(post?.post_id);
      const media = await PostMedia.getAllMediaByPostId(post?.post_id);
      const reacts = await PostReact.getAllReactByPost(post?.post_id);
      const infor_group = await GroupChannel.getGroupByGroupId(postGroup?.group_id);
      return {
        ...post, // Spread thông tin từ bài viết
        reacts,
        media, // Thêm media vào bài viết
        postGroup,
        infor_group
      };
    });

    // Đợi tất cả các promise media hoàn thành
    const postsWithMedia = await Promise.all(mediaPromises);
    console.log("dataaaaaa postttttt:", mediaPromises);

    // Gửi phản hồi thành công với dữ liệu bài viết đã bao gồm media
    res.status(200).json({
      status: true,
      data: postsWithMedia,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

const getPostById = async (req, res) => {
  const post_id = req.params.id;

  try {
    // Lấy thông tin chi tiết của bài viết
    const post = await Post.getPostById(post_id);

    // Nếu không tìm thấy bài viết, trả về 404
    if (!post) {
      return res
        .status(404)
        .json({
          status: false,
          message: "Bài viết không tồn tại hoặc đã bị xoá",
        });
    }

    // Lấy danh sách media cho bài viết
    const media = await PostMedia.getAllMediaByPostId(post_id);

    // Lấy danh sách các react cho bài viết
    const reacts = await PostReact.getAllReactByPost(post_id);

    // Kết hợp tất cả thông tin lại
    const postWithDetails = {
      ...post, // Thông tin bài viết
      media, // Danh sách media
      reacts, // Danh sách react
    };

    // Trả về phản hồi thành công với chi tiết bài viết
    res.status(200).json({
      status: true,
      data: postWithDetails,
    });
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

const listPostById = async (req, res) => {
  const my_id = req.body?.data?.user_id ?? null; // Lấy user_id từ request body
  const user_id = req.params.id; // Lấy user_id từ params của request
  try {
    const posts = await Post.getAllPostsById(user_id); // Gọi phương thức model để lấy bài viết

    // Kiểm tra quyền truy cập bài viết
    const filteredPosts = posts.filter((post) => {
      // Nếu my_id khác user_id thì không cho phép xem bài viết có phạm vi truy cập = 0
      return my_id === user_id || post.post_privacy !== 0;
    });

    // Nếu không có bài viết nào thỏa mãn điều kiện, trả về phản hồi 404
    if (filteredPosts.length === 0) {
      return res.status(200).json({ status: false, data: [] });
    }

    // Lấy tất cả media và reacts cho từng bài viết
    const mediaAndReactPromises = filteredPosts.map(async (post) => {
      const media = await PostMedia.getAllMediaByPostId(post.post_id); // Lấy media cho bài viết
      const reacts = await PostReact.getAllReactByPost(post.post_id); // Lấy reacts cho bài viết

      return {
        ...post, // Spread thông tin từ bài viết
        media, // Thêm media vào bài viết
        reacts, // Thêm reacts vào bài viết
      };
    });

    // Đợi tất cả các promise media và reacts hoàn thành
    const postsWithMediaAndReact = await Promise.all(mediaAndReactPromises);
    if (postsWithMediaAndReact.length > 0) {
      res.status(200).json({ status: true, data: postsWithMediaAndReact });
    } else {
      res.status(200).json({ status: true, data: [] });
    }
    // Gửi phản hồi thành công với dữ liệu bài viết đã bao gồm media và reacts
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};

const createCommentPostById = async (req, res) => {
  const user_id = req.params.id;
  try {
    const posts = await Post.getAllPostsById(user_id); // Call the model method to get posts
    if (posts.length > 0) {
      res.status(200).json({ status: true, data: posts });
    } else {
      res.status(404).json({ status: false });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

const deleteReactByUserID = async (req, res) => {
  const user_id = req.body?.data?.user_id;
  const post_id = req.params.id;
  try {
    const posts = await PostReact.deleteReact(user_id, post_id); // Call the model method to get posts
    if (posts) {
      res.status(200).json({ status: true });
    } else {
      res.status(404).json({ status: false });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

export {
  createPost,
  editPost,
  listPost,
  getPostById,
  listPostById,
  deletePost,
  deleteReactByUserID,
};
