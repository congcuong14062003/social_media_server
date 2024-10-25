import pool from "../../../configs/database/database.js";
import { generateId } from "../../ultils/crypto.js";

class PostReact {
  constructor(data) {
    this.post_id = data.post_id;
    this.user_id = data.user_id;
    this.react = data.react;
  }

  async create() {
    try {
      const createReactPost = `
        INSERT INTO PostReact (post_id, user_id, react)
        VALUES (?, ?, ?);
      `;
      const [result] = await pool.execute(createReactPost, [
        this.post_id,
        this.user_id,
        this.react,
      ]);

      if (result.affectedRows > 0) {
        return true;
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện câu lệnh SQL:", error);
      throw error;
    }
  }
  static async getAllReactByPost(post_id) {
    const query = `
    Select * from postreact where post_id = ?
  `;

    try {
      const [results] = await pool.execute(query, [post_id]); // Truyền my_id vào 2 lần

      return results;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }
  static async deleteReact(user_id, post_id) {
    const query = `
    DELETE from postreact where user_id = ? and post_id = ?
  `;

    try {
      const [results] = await pool.execute(query, [user_id, post_id]); // Truyền my_id vào 2 lần

      return results.affectedRows > 0;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }
}

export default PostReact;
