import { UserSetting } from "../../models/User/user_setting.model";

// Get a user setting by ID
const getUserSettingById = async (req, res) => {
    try {
        const userSetting = await UserSetting.getById(req.body?.data?.user_id);
        if (userSetting) {
            res.status(200).json({ status: true, data: userSetting });
        } else {
            res.status(404).json({ status: false, message: 'Lỗi bất định vì không xác định được người dùng' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: error.message ?? error });
    }
};


// Update a user setting
const updateUserSetting = async (req, res) => {
    try {
        const user_id = req.body?.data?.user_id;

        // Lấy cài đặt hiện tại của user
        const existingSettings = await UserSetting.getById(user_id);
        if (!existingSettings) {
            return res.status(404).json({ status: false, message: "User setting not found" });
        }

        // Gộp các giá trị cũ và mới, nếu giá trị mới không có thì giữ nguyên
        const updatedSettings = {
            post_privacy: req.body.post_privacy ?? existingSettings.post_privacy,
            story_privacy: req.body.story_privacy ?? existingSettings.story_privacy,
            dark_theme: req.body.dark_theme ?? existingSettings.dark_theme,
        };

        const userSetting = new UserSetting({
            user_id,
            ...updatedSettings,
        });

        const result = await userSetting.update();

        if (result > 0) {
            res.status(200).json({ status: true });
        } else {
            res.status(400).json({ status: false, message: "No changes were made" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message ?? error });
    }
};




export {
    getUserSettingById,
    updateUserSetting,
};
