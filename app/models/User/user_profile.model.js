import pool from "../../../configs/database/database.js";

class UserProfile {
  constructor(data) {
    this.user_id = data.user_id;
    this.date_of_birth = data.date_of_birth || null;
    this.user_address = data.user_address || null;
    this.user_school = data.user_school || null;
    this.user_work = data.user_work || null;
  }

  async create() {
    try {
      const createUserProfileQuery =
        "INSERT INTO UserProfile (user_id, date_of_birth, user_address, user_school, user_work) VALUES (?, ?, ?, ?, ?);";
      const [result] = await pool.execute(createUserProfileQuery, [
        this.user_id,
        this.date_of_birth,
        this.user_address,
        this.user_school,
        this.user_work,
      ]);

      return result.affectedRows;
    } catch (error) {
      return error;
    }
  }

  static async getById(user_id) {
    try {
      const getUserProfileByIdQuery = `
                SELECT 
                    user_id, 
                    DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, 
                    user_address, 
                    user_school, 
                    user_work 
                FROM UserProfile 
                WHERE user_id = ?`;
      const [result] = await pool.execute(getUserProfileByIdQuery, [user_id]);
      return result[0];
    } catch (error) {
      return error;
    }
  }

  static async getAll() {
    try {
      const getAllUserProfilesQuery = "SELECT * FROM UserProfile";
      const [result] = await pool.execute(getAllUserProfilesQuery);
      return result;
    } catch (error) {
      return error;
    }
  }

  async update() {
    console.log("Cập nhật hồ sơ người dùng với dữ liệu:", this);

    try {
      let updateUserProfileQuery = "UPDATE UserProfile SET";
      let params = [];
      let updates = [];

      if (this.date_of_birth !== undefined) {
        updates.push(" date_of_birth = ?");
        params.push(this.date_of_birth);
      }
      if (this.user_address !== undefined) {
        updates.push(" user_address = ?");
        params.push(this.user_address);
      }
      if (this.user_school !== undefined) {
        updates.push(" user_school = ?");
        params.push(this.user_school);
      }
      if (this.user_work !== undefined) {
        updates.push(" user_work = ?");
        params.push(this.user_work);
      }

      if (updates.length === 0) {
        throw new Error("Không có trường nào được cập nhật.");
      }

      updateUserProfileQuery += updates.join(", ");
      updateUserProfileQuery += " WHERE user_id = ?";
      params.push(this.user_id);

      const [result] = await pool.execute(updateUserProfileQuery, params);
      console.log("Kết quả cập nhật hồ sơ người dùng:", result);

      return result.affectedRows;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  static async delete(user_id) {
    try {
      const deleteUserProfileQuery =
        "DELETE FROM UserProfile WHERE user_id = ?";
      const [result] = await pool.execute(deleteUserProfileQuery, [user_id]);
      return result.affectedRows;
    } catch (error) {
      return error;
    }
  }
}

export { UserProfile };
