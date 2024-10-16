import pool from "../../../configs/database/database";

class UserFaceData {
    constructor(data) {
        this.user_id_encode = data.user_id_encode;
        this.media_link = data.media_link;
    }

    async create() {
        try {
            console.log(this);
            
            const createUserFaceDataQuery = "INSERT INTO UserFaceData (user_id_encode, media_link) VALUES (?, ?);"
            const [result] = await pool.execute(createUserFaceDataQuery, [
                this.user_id_encode,
                this.media_link
            ]);
            return result.affectedRows;
        } catch (error) {
            return error;
        }
    }

    static async getById(user_id_encode) {
        try {
            const getUserFaceDataByIdQuery = "SELECT * FROM UserFaceData WHERE user_id_encode = ?";
            const [result] = await pool.execute(getUserFaceDataByIdQuery, [
                user_id_encode
            ]);
            return result;
        } catch (error) {
            return error;
        }
    }

    static async getAll() {
        try {
            const getAllUserFaceDataQuery = "SELECT * FROM UserFaceData";
            const [result] = await pool.execute(getAllUserFaceDataQuery);
            return result;
        } catch (error) {
            return error;
        }
    }


    static async delete(user_id_encode) {
        try {
            console.log(user_id_encode);
            
            const deleteUserFaceDataQuery = "DELETE FROM UserFaceData WHERE user_id_encode = ?";
            const [result] = await pool.execute(deleteUserFaceDataQuery, [
                user_id_encode
            ]);
            return result.affectedRows;
        } catch (error) {
            return error;
        }
    }
}

export {
    UserFaceData
}
