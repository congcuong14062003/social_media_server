import pool from "../../../configs/database/database.js";
import { generateId } from "../../ultils/crypto.js";

class Notice {
  constructor(data) {
    this.notice_id = data.notice_id || generateId("notice_");
    this.user_create_notice = data.user_create_notice;
    this.user_id = data.user_id;
    this.content = data.content;
    this.type = data.type;
    this.is_read = data.is_read || false;
    this.target_id = data.target_id || null;
  }

  // Thêm thông báo mới
  async create() {
    try {
      const query = `
        INSERT INTO Notice (notice_id, user_create_notice, user_id, content, type, target_id, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?);
      `;
      const [result] = await pool.execute(query, [
        this.notice_id,
        this.user_create_notice,
        this.user_id,
        this.content,
        this.type,
        this.target_id,
        this.is_read,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Lỗi khi tạo thông báo:", error);
      throw error;
    }
  }

  // Cập nhật trạng thái đọc của thông báo
  static async markAsRead(notice_id) {
    try {
      const query = `UPDATE Notice SET is_read = TRUE WHERE notice_id = ?;`;
      const [result] = await pool.execute(query, [notice_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đọc thông báo:", error);
      throw error;
    }
  }

  // Xoá thông báo
  static async deleteById(notice_id) {
    try {
      const query = `DELETE FROM Notice WHERE notice_id = ?;`;
      const [result] = await pool.execute(query, [notice_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      throw error;
    }
  }
  static async deleteAllNoticeByUser(user_id) {
    try {
      const query = `DELETE FROM Notice WHERE user_id = ?;`;
      const [result] = await pool.execute(query, [user_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      throw error;
    }
  }
  
  static async deleteAllNoticeCurrentByUser(user_id) {
    try {
      const query = `UPDATE notice SET count_notice = 0 where user_id = ?`;
      const [result] = await pool.execute(query, [user_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      throw error;
    }
  }



  // Lấy tất cả thông báo của một người dùng
  static async getAllByUserId(user_id) {
    try {
      const query = `
        SELECT * FROM Notice
        WHERE user_id = ?
        ORDER BY created_at DESC;
      `;
      const [results] = await pool.execute(query, [user_id]);
      return results;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error);
      throw error;
    }
  }

  // Lấy thông tin chi tiết của một thông báo
  static async getById(notice_id) {
    try {
      const query = `SELECT * FROM Notice WHERE notice_id = ?;`;
      const [result] = await pool.execute(query, [notice_id]);
      return result[0];
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chi tiết thông báo:", error);
      throw error;
    }
  }
}

export default Notice;
