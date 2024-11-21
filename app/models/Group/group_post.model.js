import pool from "../../../configs/database/database";
import { generateId } from "../../ultils/crypto";
import GroupMember from "./group_member.model";

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

  static async getAllGroupPostJoined(user_id) {
    try {
      const listMyGroup = await GroupMember.getAllGroupByMemberID(user_id);
      const groupIds = listMyGroup.map((group) => group?.group_id);

      // Handle case where user is not in any group
      if (groupIds.length === 0) {
        return []; // Return an empty array if no groups are joined
      }
      // If `groupIds` is an array of IDs, use placeholders
      const placeholders = groupIds.map(() => "?").join(",");
      const query = `SELECT * FROM GroupPost WHERE status = 1 AND group_id IN (${placeholders})`;

      // Execute the query with the group IDs as parameters
      const [result] = await pool.execute(query, groupIds);
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

  static async getGroupPostByPostId(post_id) {
    try {
      const query = `SELECT * FROM GroupPost WHERE post_id = ?;`;
      const [result] = await pool.execute(query, [post_id]);
      return result[0];
    } catch (error) {
      console.error(error);
    }
  }
  static async getGroupPostAcceptedByPostId(post_id) {
    try {
      const query = `SELECT * FROM GroupPost WHERE post_id = ? and status = 1;`;
      const [result] = await pool.execute(query, [post_id]);
      return result[0];
    } catch (error) {
      console.error(error);
    }
  }
  // Lấy bài đăng nhóm theo ID
  static async getGroupPostByUserId(member_id) {
    try {
      const query = `SELECT * FROM GroupPost WHERE member_id = ?;`;
      const [result] = await pool.execute(query, [member_id]);
      return result;
    } catch (error) {
      console.error(error);
    }
  }

  // Cập nhật bài đăng nhóm
  // Cập nhật bài đăng nhóm
  static async updateGroupPost(group_post_id, status, post_id) {
    try {
      if (status === 1) {
        // Cập nhật trạng thái bài viết nhóm thành "được duyệt"
        const query = `
        UPDATE GroupPost
        SET status = 1
        WHERE group_post_id = ?;
      `;
        const [result] = await pool.execute(query, [group_post_id]);
        return result.affectedRows > 0;
      } else if (status === 0) {
        // Xóa bài viết trong bảng GroupPost và Post
        const deleteGroupPostQuery = `
        DELETE FROM GroupPost
        WHERE group_post_id = ?;
      `;
        const deletePostQuery = `
        DELETE FROM Post
        WHERE post_id = ?;
      `;

        // Sử dụng transaction để đảm bảo cả hai thao tác đều thành công
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          await connection.execute(deleteGroupPostQuery, [group_post_id]);
          await connection.execute(deletePostQuery, [post_id]);
          await connection.commit();
          return true;
        } catch (error) {
          await connection.rollback();
          console.error("Transaction error:", error);
          return false;
        } finally {
          connection.release();
        }
      }
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
