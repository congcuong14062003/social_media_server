import PostReact from "../../models/Post/post_react.model";

// Thả tim bài viết
const createReactPostById = async (req, res) => {
  const post_id = req.params.id;
  const { user_id, react } = req.body;
  try {
    const reactPost = new PostReact({
      post_id,
      user_id,
      react,
    });

    const result = await reactPost.create();

    if (result) {
      res.status(200).json({ status: true });
    } else {
      res.status(404).json({ status: false});
    }
  } catch (error) {
    console.error("Error creating react:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};


export { createReactPostById };
