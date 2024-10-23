import uploadFile from "../../../configs/cloud/cloudinary.config";
import Story from "../../models/Story/story.model";
import { ProfileMedia } from "../../models/User/profile_media.model";
import { UserProfile } from "../../models/User/user_profile.model";
import { Users } from "../../models/User/users.model";

// tạo tin
const createStory = async (req, res) => {
  try {
    const file = req.files[0]; // Lấy file từ FormData
    const { user_id, story_privacy } = req.body; // Lấy dữ liệu từ body
    const mediaUrl = await uploadFile(file, process.env.NAME_FOLDER_STORY);
    const story = new Story({
      user_id: user_id,
      media_link: mediaUrl.url,
      story_privacy: story_privacy,
    });
    await story.create();
    res
      .status(200)
      .json({ status: true, message: "Story đã được tạo thành công" });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};
// list stories
const listStory = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id; // Lấy ID người dùng từ body
    const stories = await Story.getAllStory(user_id);

    // Lọc ra các stories có phạm vi truy cập bằng 1
    const publicStories = stories.filter((story) => story.story_privacy === 1);

    // Khởi tạo các mảng để chứa thông tin stories và thông tin người dùng
    const storiesWithUserInfo = await Promise.all(
      publicStories.map(async (story) => {
        const profileUser = await Users.getById(story.user_id);
        const user_avatar = await ProfileMedia.getLatestAvatarById(
          story.user_id
        ); // Gọi hàm để lấy avatar mới nhất

        return {
          story_id: story.story_id,
          media_link: story.media_link,
          created_at: story.created_at,
          user_id: story.user_id,
          user_name: profileUser.user_name, // Tên người dùng
          user_avatar: user_avatar, // Avatar của người dùng
          story_privacy: story.story_privacy,
        };
      })
    );

    res.status(200).json({
      status: true,
      stories: storiesWithUserInfo,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách story:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};
// Lấy story theo ID
const storyById = async (req, res) => {
  try {
    const story_id = req.params.id; // Lấy ID story từ params
    const story = await Story.getStoryById(story_id);

    if (!story) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy story",
      });
    }

    console.log("story: ", story);

    const user_id = story?.user_id;
    console.log("user_id: ", user_id);

    // Kiểm tra nếu user_id không hợp lệ
    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "Không thể lấy thông tin người dùng cho story này",
      });
    }

    // Lấy thông tin người dùng và avatar liên quan đến story
    const profileUser = await Users.getById(user_id);
    const user_avatar = await ProfileMedia.getLatestAvatarById(user_id);

    console.log("profileUser:", profileUser);
    console.log("user_avatar: ", user_avatar);

    const storyWithUserInfo = {
      story_id: story.story_id,
      media_link: story.media_link,
      created_at: story.created_at,
      user_id: story.user_id,
      user_name: profileUser?.user_name || "Unknown",
      user_avatar: user_avatar || null,
      story_privacy: story.story_privacy,
    };

    res.status(200).json({
      status: true,
      story: storyWithUserInfo,
    });
  } catch (error) {
    console.error("Lỗi khi lấy story theo ID:", error);
    res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};

export { createStory, listStory, storyById };
