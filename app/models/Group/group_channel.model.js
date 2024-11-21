import pool from "../../../configs/database/database";
import { generateId } from "../../ultils/crypto";

class GroupChannel {
  constructor(data) {
    this.group_id = data.group_id;
    this.group_name = data.group_name;
    this.group_slogan = data.group_slogan;
    this.group_privacy = data.group_privacy;
    this.avatar_media_link = data.avatar_media_link;
    this.cover_media_link = data.cover_media_link;
    this.created_at = data.created_at;
  }

  async create() {
    const group_id = generateId("grp_");
    try {
      const createGroup = `
        INSERT INTO GroupChannel (group_id, group_name, group_slogan, group_privacy, avatar_media_link, cover_media_link)
        VALUES (?, ?, ?, ?, ?, ?);
      `;

      const [result] = await pool.execute(createGroup, [
        group_id,
        this.group_name,
        this.group_slogan,
        this.group_privacy * 1,
        this.avatar_media_link,
        this.cover_media_link,
      ]);

      return result.affectedRows > 0 ? group_id : false;
    } catch (error) {
      return error;
    }
  }

  static async getAllGroups() {
    try {
      const getGroupsQuery = `SELECT * FROM GroupChannel;`;
      const [result] = await pool.execute(getGroupsQuery);
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  // static async getAllGroupsSuggest() {
  //   try {
  //     const getGroupsQuery = `SELECT * FROM GroupChannel where member_id ;`;
  //     const [result] = await pool.execute(getGroupsQuery);
  //     return result;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  static async getGroupByGroupId(group_id) {
    try {
      const getGroupsQuery = `SELECT * FROM GroupChannel WHERE group_id = ?;`;
      const [result] = await pool.execute(getGroupsQuery, [group_id]);
      return result[0];
    } catch (error) {
      console.error(error);
    }
  }

  // Phương thức cập nhật thông tin nhóm
  static async updateGroup(group_id, data) {
    const {
      group_name,
      group_slogan,
      group_privacy,
      avatar_media_link,
      cover_media_link,
    } = data;
    console.log("data group: ", data);
    
    // Tạo đối tượng chứa các cột cần cập nhật
    const updateFields = [];
    const updateValues = [];

    // Kiểm tra và thêm vào các trường cần cập nhật
    if (group_name) {
      updateFields.push("group_name = ?");
      updateValues.push(group_name);
    }
    if (group_slogan) {
      updateFields.push("group_slogan = ?");
      updateValues.push(group_slogan);
    }
    if (group_privacy === 0 || group_privacy === 1) {
      updateFields.push("group_privacy = ?");
      updateValues.push(group_privacy * 1); // Chuyển đổi sang số nếu cần
    }
    if (avatar_media_link) {
      updateFields.push("avatar_media_link = ?");
      updateValues.push(avatar_media_link);
    }
    if (cover_media_link) {
      updateFields.push("cover_media_link = ?");
      updateValues.push(cover_media_link);
    }

    // Nếu không có trường nào cần cập nhật, trả về false
    if (updateFields.length === 0) {
      return false;
    }

    // Tạo câu lệnh SQL động để chỉ cập nhật các trường có giá trị
    const updateQuery = `
    UPDATE GroupChannel
    SET ${updateFields.join(", ")}
    WHERE group_id = ?;
  `;

    // Thêm group_id vào cuối cùng của mảng giá trị
    updateValues.push(group_id);

    try {
      const [result] = await pool.execute(updateQuery, updateValues);

      // Kiểm tra xem có bản ghi nào bị ảnh hưởng không
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // Phương thức xóa nhóm
  static async deleteGroup(group_id) {
    try {
      const deleteQuery = `DELETE FROM GroupChannel WHERE group_id = ?;`;
      const [result] = await pool.execute(deleteQuery, [group_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

export default GroupChannel;
