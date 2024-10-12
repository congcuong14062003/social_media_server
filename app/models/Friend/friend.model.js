import pool from "../../../configs/database/database.js";

class Friend {
  constructor(data) {
    this.requestor_id = data.requestor_id;
    this.receiver_id = data.receiver_id;
    this.relationship_status = data.relationship_status || 0;
  }

  async create() {
    try {
      const createFriendRequestQuery = `
                INSERT INTO Friend (requestor_id, receiver_id, relationship_status)
                VALUES (?, ?, ?);
            `;
      const [result] = await pool.execute(createFriendRequestQuery, [
        this.requestor_id,
        this.receiver_id,
        this.relationship_status,
      ]);

      return result.affectedRows;
    } catch (error) {
      return error;
    }
  }

  static async updateStatus(requestor_id, receiver_id, relationship_status) {
    try {
      const updateStatusQuery = `
                UPDATE Friend 
                SET relationship_status = ?
                WHERE (requestor_id = ? AND receiver_id = ?)
                   OR (requestor_id = ? AND receiver_id = ?);
            `;
      const [result] = await pool.execute(updateStatusQuery, [
        relationship_status,
        requestor_id,
        receiver_id,
        receiver_id, // Đảo ngược vị trí để kiểm tra quan hệ hai chiều
        requestor_id,
      ]);

      return result.affectedRows;
    } catch (error) {
      return error;
    }
  }
  // danh sách bạn bè
  static async getAllFriends(user_id) {
    try {
      const getFriendsQuery = `
        SELECT 
          u.user_id AS friend_id,
          u.user_name,
          pm.media_link AS avatar_link
        FROM Friend f
        JOIN users u 
          ON (u.user_id = f.requestor_id AND f.receiver_id = ?)
          OR (u.user_id = f.receiver_id AND f.requestor_id = ?)
        LEFT JOIN (
          SELECT user_id, media_link, created_at
          FROM ProfileMedia
          WHERE media_type = 'avatar' 
            AND (user_id, created_at) IN (
              SELECT user_id, MAX(created_at)
              FROM ProfileMedia
              WHERE media_type = 'avatar'
              GROUP BY user_id
            )
        ) pm ON pm.user_id = u.user_id
        WHERE f.relationship_status = 1
        ORDER BY pm.created_at DESC
      `;

      const [result] = await pool.execute(getFriendsQuery, [user_id, user_id]);

      return result;
    } catch (error) {
      return error;
    }
  }

  // danh sách bạn bè gợi ý
  static async getAllFriendsSuggest(user_id) {
    try {
      const getFriendsSuggestQuery = `
SELECT 
    u.user_id AS friend_id,
    u.user_name,
    pm.media_link AS avatar_link
FROM users u
LEFT JOIN Friend f1 
    ON (u.user_id = f1.requestor_id AND f1.receiver_id = ?)
    OR (u.user_id = f1.receiver_id AND f1.requestor_id = ?)
LEFT JOIN (
    SELECT user_id, media_link, created_at
    FROM ProfileMedia
    WHERE media_type = 'avatar'
      AND created_at IN (
          SELECT MAX(created_at)
          FROM ProfileMedia
          WHERE media_type = 'avatar'
          GROUP BY user_id
      )
) pm ON pm.user_id = u.user_id
WHERE u.user_id != ?
  AND f1.relationship_status IS NULL
ORDER BY pm.created_at DESC;

    `;

      const [result] = await pool.execute(getFriendsSuggestQuery, [
        user_id,
        user_id,
        user_id,
      ]);

      return result;
    } catch (error) {
      return error;
    }
  }
  // danh sách những người mà mình đã gửi lời mời kết bạn
  static async getAllFriendsInvitedSuggest(user_id) {
    try {
      const getFriendsInvitedSuggestQuery = `
     SELECT 
    u.user_id AS friend_id,
    u.user_name,
    pm.media_link AS avatar_link
FROM Friend f
JOIN users u 
    ON u.user_id = f.receiver_id
LEFT JOIN (
    SELECT user_id, media_link, created_at
    FROM ProfileMedia
    WHERE media_type = 'avatar'
      AND created_at IN (
          SELECT MAX(created_at)
          FROM ProfileMedia
          WHERE media_type = 'avatar'
          GROUP BY user_id
      )
) pm 
    ON pm.user_id = u.user_id
WHERE f.requestor_id = ?
  AND f.relationship_status = 0  -- Trạng thái kết bạn đang chờ
ORDER BY pm.created_at DESC;
      `;
      const [result] = await pool.execute(getFriendsInvitedSuggestQuery, [
        user_id,
      ]);
      return result;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
  // Danh sách người gửi kết bạn đến mình
  static async ListInviting(id_user) {
    try {
      const list_inviting = `
        SELECT 
          u.user_id, 
          u.user_name, 
          pm.media_link AS avatar_link
        FROM friend f
        JOIN users u 
          ON f.requestor_id = u.user_id
        LEFT JOIN (
          SELECT user_id, media_link
          FROM ProfileMedia
          WHERE media_type = 'avatar' 
            AND (user_id, created_at) IN (
              SELECT user_id, MAX(created_at)
              FROM ProfileMedia
              WHERE media_type = 'avatar'
              GROUP BY user_id
            )
        ) pm ON pm.user_id = u.user_id
        WHERE f.receiver_id = ? 
          AND f.relationship_status = 0  -- Chỉ lấy những lời mời đang chờ
      `;
      const [rows] = await pool.execute(list_inviting, [id_user]);
      console.log("Danh sách gửi lời mời: ", rows);
      return rows.length > 0 ? rows : null;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }

  // huỷ yêu cầu kết bạn
  static async cancelFriendRequest(requestor_id, receiver_id) {
    const query = `
      DELETE FROM friend 
      WHERE (requestor_id = ? AND receiver_id = ?)
         OR (requestor_id = ? AND receiver_id = ?)
    `;
    try {
      const [result] = await pool.execute(query, [
        requestor_id,
        receiver_id,
        receiver_id,
        requestor_id,
      ]);
      return result.affectedRows;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
  // check is friend by id
  static async isFriend(my_id, user_id) {
    try {
      const query = `
        SELECT COUNT(*) AS count
        FROM friend
        WHERE (
          (requestor_id = ? AND receiver_id = ?)
          OR (requestor_id = ? AND receiver_id = ?)
        )
        AND relationship_status = 1;
      `;
      const [rows] = await pool.execute(query, [
        my_id,
        user_id,
        user_id,
        my_id,
      ]);
      console.log(rows);

      return rows[0].count > 0; // Trả về true nếu có ít nhất một bản ghi
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }

  // kết bạn
  static async addFriendById(id_user, friend_id) {
    try {
      // Kiểm tra xem đã có mối quan hệ nào tồn tại giữa 2 người dùng chưa
      const checkFriendQuery = `
        SELECT relationship_status FROM Friend 
        WHERE (requestor_id = ? AND receiver_id = ?)
        OR (requestor_id = ? AND receiver_id = ?)
      `;
      const [existingRelationship] = await pool.execute(checkFriendQuery, [
        id_user,
        friend_id,
        friend_id,
        id_user,
      ]);

      // Nếu đã có mối quan hệ (kể cả status = 0, 1), không thêm lời mời mới
      if (existingRelationship.length > 0) {
        return 0; // Đã có mối quan hệ, không thể gửi lời mời
      }

      // Thêm yêu cầu kết bạn mới
      const addFriendQuery = `
        INSERT INTO Friend (requestor_id, receiver_id, relationship_status) 
        VALUES (?, ?, ?)
      `;
      const [rows] = await pool.execute(addFriendQuery, [
        id_user,
        friend_id,
        0,
      ]); // 0 là trạng thái lời mời đang chờ
      return rows.affectedRows;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }

  static async deleteFriend(requestor_id, receiver_id) {
    try {
      const deleteFriendQuery = `
                DELETE FROM Friend 
                WHERE (requestor_id = ? AND receiver_id = ?) OR (requestor_id = ? AND receiver_id = ?);
            `;
      const [result] = await pool.execute(deleteFriendQuery, [
        requestor_id,
        receiver_id,
        receiver_id,
        requestor_id,
      ]);
      return result.affectedRows;
    } catch (error) {
      return error;
    }
  }

  // Lấy tất cả yêu cầu kết bạn dựa trên ID người nhận
  static async getAllRequestorsByReceiverId(receiver_id) {
    try {
      const getAllRequestorsQuery = `
                SELECT * FROM Friend 
                WHERE receiver_id = ? AND relationship_status = 0;
            `;
      const [result] = await pool.execute(getAllRequestorsQuery, [receiver_id]);
      return result;
    } catch (error) {
      return error;
    }
  }

  // Kiểm tra xem lời mời kết bạn đã tồn tại chưa
  static async checkExistingRequest(requestor_id, receiver_id) {
    try {
      const checkRequestQuery = `
                SELECT * FROM Friend 
                WHERE (requestor_id = ? AND receiver_id = ?)
                   OR (requestor_id = ? AND receiver_id = ?);
            `;
      const [result] = await pool.execute(checkRequestQuery, [
        requestor_id,
        receiver_id,
        receiver_id, // Đảo ngược vị trí để kiểm tra quan hệ hai chiều
        requestor_id,
      ]);

      return result[0] ?? []; // Trả về true nếu tồn tại yêu cầu
    } catch (error) {
      return error;
    }
  }

  // chấp nhận lời mời
  static async AcceptFriendById(id_user, friend_id) {
    try {
      // console.log(id_user, friend_id);
      const add_friend =
        "update friend set relationship_status = 1 where requestor_id = ? and receiver_id = ?";
      const [rows] = await pool.execute(add_friend, [id_user, friend_id, 0]);
      return rows.affectedRows;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
}

export default Friend;
