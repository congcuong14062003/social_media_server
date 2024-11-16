import pool from "../../../configs/database/database";
import { generateId } from "../../ultils/crypto";

class GroupPost {
  constructor(data) {
    this.group_id = data.group_id;
    this.post_id = data.post_id;
    this.member_id = data.member_id;
    this.status = data.status;
  }

  // Phương thức tạo mới GroupPost
  async create() {
    const group_post_id = generateId("gpost_");
    try {
      const query = `
        INSERT INTO GroupPost (group_post_id, group_id, post_id, member_id, status)
        VALUES (?, ?, ?, ?, ?);
      `;

      const [result] = await pool.execute(query, [
        group_post_id,
        this.group_id,
        this.post_id,
        this.member_id,
        this.status,
      ]);

      return result.affectedRows > 0 ? group_post_id : false;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // Lấy tất cả các bài đăng nhóm
  static async getAllGroupPostsAccepted(group_id) {
    try {
      const query = `SELECT * FROM GroupPost WHERE status = 1 and group_id = ?;`;
      const [result] = await pool.execute(query, [group_id]);
      return result;
    } catch (error) {
      console.error(error);
    }
  }

  static async getAllGroupPostsUnapproved(group_id) {
    try {
      const query = `SELECT * FROM GroupPost WHERE status = 0 and group_id = ?;`;
      const [result] = await pool.execute(query, [group_id]);
      return result;
    } catch (error) {
      console.error(error);
    }
  }

  // Lấy bài đăng nhóm theo ID
  static async getGroupPostById(group_post_id) {
    try {
      const query = `SELECT * FROM GroupPost WHERE group_post_id = ?;`;
      const [result] = await pool.execute(query, [group_post_id]);
      return result[0];
    } catch (error) {
      console.error(error);
    }
  }

  // Cập nhật bài đăng nhóm
  static async updateGroupPost(group_post_id, status) {
    let query = `
       UPDATE GroupPost
       SET status = 1
       WHERE group_post_id = ?;
     `;
    if (status === 0) {
      query = "DELETE FROM GroupPost WHERE group_post_id = ?;";
    }

    try {
      const [result] = await pool.execute(query, group_post_id);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  // xoá tất cả bài bài viết theo nhóm
  static async deleteAllGroupPost(group_id) {
    let query = `
       DELETE from GroupPost
       WHERE group_id = ?;
     `;
    try {
      const [result] = await pool.execute(query, [group_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

export default GroupPost;
