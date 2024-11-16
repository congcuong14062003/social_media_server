import GroupPost from "../../models/Group/group_post.model";
import Post from "../../models/Post/post.model";
import PostMedia from "../../models/Post/post_media.model";
import PostReact from "../../models/Post/post_react.model";

const createGroupPost = async (req, res) => {
  const { post_id } = req.body;
  const member_id = req.body?.data?.user_id;
  const group_id = req.params?.group_id;

  try {
    // Kiểm tra các trường bắt buộc
    if (!group_id || !post_id || !member_id) {
      return res.status(400).json({
        status: false,
        message: "Thông tin không được để trống!",
      });
    }


    // Tạo bài đăng mới
    const groupPost = new GroupPost({ group_id, post_id, member_id, status: 0 });
    const group_post_id = await groupPost.create();

    if (!group_post_id) {
      return res.status(400).json({
        status: false,
        message: "Lỗi khi tạo bài đăng nhóm!",
      });
    }

    res.status(200).json({
      status: true,
      group_post_id,
    });
  } catch (error) {
    console.error("Error creating group post:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

const getAllAcceptedGroupPosts = async (req, res) => {
    const group_id = req.params?.group_id;
  try {
    const posts = await GroupPost.getAllGroupPostsAccepted(group_id);
    console.log("postssssssss: ", posts);
    
     // Lấy tất cả media cho từng bài viết
     const mediaPromises = posts.map(async (post) => {
        const postContent = await Post.getPostById(post?.post_id);
        const media = await PostMedia.getAllMediaByPostId(post?.post_id);
        const reacts = await PostReact.getAllReactByPost(post?.post_id);
        return {
          ...postContent, // Spread thông tin từ bài viết
          reacts,
          media, // Thêm media vào bài viết
        };
      });
  
      // Đợi tất cả các promise media hoàn thành
      const postsWithMedia = await Promise.all(mediaPromises);
    res.status(200).json({
      status: true,
      data: postsWithMedia,
    });
    console.log("postsWithMedia: ", postsWithMedia);
    
  } catch (error) {
    console.error("Error fetching accepted group posts:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

const getAllUnapprovedGroupPosts = async (req, res) => {
    const group_id = req.params?.group_id;
    try {
      const posts = await GroupPost.getAllGroupPostsUnapproved(group_id);
      console.log("postssssssss: ", posts);
      
       // Lấy tất cả media cho từng bài viết
       const mediaPromises = posts.map(async (post) => {
          const postContent = await Post.getPostById(post?.post_id);
          const media = await PostMedia.getAllMediaByPostId(post?.post_id);
          const reacts = await PostReact.getAllReactByPost(post?.post_id);
          return {
            ...postContent, // Spread thông tin từ bài viết
            reacts,
            media, // Thêm media vào bài viết
          };
        });
    
        // Đợi tất cả các promise media hoàn thành
        const postsWithMedia = await Promise.all(mediaPromises);
      res.status(200).json({
        status: true,
        data: postsWithMedia,
      });
      console.log("postsWithMedia: ", postsWithMedia);
      
    } catch (error) {
      console.error("Error fetching accepted group posts:", error);
      res.status(500).json({
        status: false,
        message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
      });
    }
};

const updateGroupPostStatus = async (req, res) => {
  const group_post_id = req.params?.group_post_id;
  const { status } = req.body;

  try {
    if (!group_post_id || typeof status === "undefined") {
      return res.status(400).json({
        status: false,
        message: "group_post_id và trạng thái không được để trống!",
      });
    }

    const isUpdated = await GroupPost.updateGroupPost(group_post_id, status);

    if (isUpdated) {
      return res.status(200).json({
        status: true,
        message: status === 1 ? "Phê duyệt bài đăng thành công!" : "Xóa bài đăng thành công!",
      });
    }

    res.status(400).json({
      status: false,
      message: "Không thể cập nhật bài đăng nhóm.",
    });
  } catch (error) {
    console.error("Error updating group post status:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
    });
  }
};

export {
  createGroupPost,
  getAllAcceptedGroupPosts,
  getAllUnapprovedGroupPosts,
  updateGroupPostStatus,
};
