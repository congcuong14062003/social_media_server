import pool from "../../../configs/database/database.js";

class UserSetting {
    constructor(data) {
        this.user_id = data.user_id;
        this.post_privacy = parseInt(data.post_privacy);
        this.story_privacy = parseInt(data.story_privacy);
        this.dark_theme = parseInt(data.dark_theme);
    }

    async create() {
        try {
            console.log(this);
            
            const createUserSettingQuery = "INSERT INTO UserSetting (user_id, post_privacy, story_privacy, dark_theme) VALUES (?, ?, ?, ?);"
            const [result] = await pool.execute(createUserSettingQuery, [
                this.user_id,
                1,
                1,
                1
            ]);
            return result.affectedRows;
        } catch (error) {
            return error;
        }
    }

    static async getById(user_id) {
        try {

            const getUserSettingByIdQuery = "SELECT * FROM usersetting WHERE user_id = ?";
            const [result] = await pool.execute(getUserSettingByIdQuery, [
                user_id
            ]);
            console.log("user setting: ", user_id);
            
            return result[0];
        } catch (error) {
            return error;
        }
    }

    static async getAll() {
        try {
            const getAllUserSettingsQuery = "SELECT * FROM UserSetting";
            const [result] = await pool.execute(getAllUserSettingsQuery);
            return result;
        } catch (error) {
            return error;
        }
    }

    async update() {
        try {
            let updateUserSettingQuery = "UPDATE UserSetting SET";
            let params = [];
            let updates = [];

            if (this.post_privacy !== undefined) {
                updates.push(" post_privacy = ?");
                params.push(this.post_privacy);
            }
            if (this.story_privacy !== undefined) {
                updates.push(" story_privacy = ?");
                params.push(this.story_privacy);
            }
            if (this.dark_theme !== undefined) {
                updates.push(" dark_theme = ?");
                params.push(this.dark_theme);
            }

            if (updates.length === 0) {
                throw new Error("Không có trường nào được cập nhật.");
            }

            updateUserSettingQuery += updates.join(",");
            updateUserSettingQuery += " WHERE user_id = ?";
            params.push(this.user_id);

            console.log(this, updateUserSettingQuery, params);
            const [result] = await pool.execute(updateUserSettingQuery, params);
            return result.affectedRows;
        } catch (error) {
            console.error('Error updating user settings:', error);
            throw error;
        }
    }


    static async delete(user_id) {
        try {
            const deleteUserSettingQuery = "DELETE FROM UserSetting WHERE user_id = ?";
            const [result] = await pool.execute(deleteUserSettingQuery, [
                user_id
            ]);
            return result.affectedRows;
        } catch (error) {
            return error;
        }
    }
}

export {
    UserSetting
}
