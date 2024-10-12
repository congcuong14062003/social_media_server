import Post from "../../models/Post/post.model";

// tạo bài viết
const createPost = async (req, res) => {
  try {
    // Lấy dữ liệu từ request body
    const { user_id, post_privacy, post_text, react_emoji } = req.body;
    
    
    // Tạo instance của Post
    const post = new Post({
      user_id,
      post_privacy,
      post_text,
      react_emoji: react_emoji || null, // nếu không có react_emoji, đặt mặc định là null
    });

    // Thực hiện tạo bài viết
    const result = await post.create();

    if (result) {
      res.status(200).json({ status: true, message: "Bài viết đã được tạo thành công" });
    } else {
      res.status(400).json({ status: false, message: "Không thể tạo bài viết" });
    }
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};
const listPost = async (req, res) => {
  const my_id = req.body?.data?.user_id ?? null;
  try {
    const posts = await Post.getAllPosts(my_id); // Call the model method to get posts
    if (posts.length > 0) {
      res.status(200).json({ status: true, data: posts });
    } else {
      res.status(404).json({ status: false});
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
}

export { createPost ,listPost};
