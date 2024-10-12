import pool from "../../../configs/database/database.js";
import { generateId } from "../../ultils/crypto.js";

class Post {
  constructor(data) {
    console.log("dataaaaaaaa: ", data);

    this.post_id = data.post_id;
    this.user_id = data.user_id;
    this.post_privacy = data.post_privacy;
    this.post_text = data.post_text || null; // Nếu không có text, mặc định là null
    this.react_emoji = data.react_emoji || null; // Mặc định null nếu không có emoji
  }

  async create() {
    const post_id = this.post_id ?? generateId("post_");
    try {
      const createPostRequestQuery = `
        INSERT INTO Post (post_id,user_id, post_privacy, post_text, react_emoji)

        VALUES (?, ?, ?, ?, ?);
      `;
      const [result] = await pool.execute(createPostRequestQuery, [
        post_id,
        this.user_id,
        this.post_privacy,
        this.post_text,
        this.react_emoji,
      ]);

      // Kiểm tra nếu có thay đổi số dòng bị ảnh hưởng (đã chèn thành công)
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Lỗi khi thực hiện câu lệnh SQL:", error);
      throw error;
    }
  }
  static async getAllPosts(my_id) {
    const query = `
SELECT 
    p.post_id, 
    p.post_text, 
    p.post_privacy, 
    u.user_id, 
    u.user_name, 
    up.media_link AS avatar,
    p.created_at 
FROM 
    Post p
JOIN 
    users u ON p.user_id = u.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        media_link
    FROM 
        ProfileMedia
    WHERE 
        media_type = 'avatar'  -- Lấy chỉ những media có type là 'avatar'
        AND (user_id, created_at) IN (
            SELECT user_id, MAX(created_at) 
            FROM ProfileMedia
            WHERE media_type = 'avatar'  -- Thêm điều kiện vào subquery
            GROUP BY user_id
        )
) up ON u.user_id = up.user_id
WHERE 
    (p.user_id = ? AND p.post_privacy IN (0, 1))  -- Lấy bài viết của người dùng hiện tại với phạm vi 0 hoặc 1
    OR (p.user_id != ? AND p.post_privacy = 1)    -- Lấy bài viết của người khác chỉ khi phạm vi là 1
ORDER BY 
    p.created_at DESC;
  `;

    try {
      const [results] = await pool.execute(query, [my_id, my_id]); // Truyền my_id vào 2 lần
      return results;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }
}

export default Post;
