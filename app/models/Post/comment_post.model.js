import pool from "../../../configs/database/database.js";
import { generateId } from "../../ultils/crypto.js";

class PostComment {
  constructor(data) {
    this.comment_id = data.comment_id ?? generateId("cmt_");
    this.post_id = data.post_id || null;
    this.commenting_user_id = data.commenting_user_id || null;
    this.comment_text = data.comment_text || null;
    this.media_link = data.media_link || null;
  }

  async create() {
    const createCommentQuery = `
      INSERT INTO PostComment (comment_id, post_id, commenting_user_id, comment_text, media_link)
      VALUES (?, ?, ?, ?, ?);
    `;
    const [result] = await pool.execute(createCommentQuery, [
      this.comment_id,
      this.post_id,
      this.commenting_user_id,
      this.comment_text,
      this.media_link,
    ]);

    return result.affectedRows > 0;
  }

  static async getCommentsWithSubComments(post_id) {
    try {
      const query = `
            WITH LatestProfileMedia AS (
      SELECT 
          user_id, 
          media_link, 
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
      FROM ProfileMedia
      WHERE media_type = 'avatar'
  )
  SELECT 
      c.comment_id, 
      c.post_id, 
      c.commenting_user_id, 
      c.comment_text, 
      c.media_link,
      c.created_at AS comment_created_at,
      u.user_name AS commenting_user_name,
      lpm.media_link AS avatar, -- Sửa chỗ này để dùng CTE
      sc.sub_comment_id, 
      sc.replying_user_id, 
      sc.comment_text AS sub_comment_text, 
      sc.media_link AS sub_media_link,
      sc.created_at AS sub_comment_created_at,
      su.user_name AS replying_user_name,
      la.media_link AS replying_user_avatar
  FROM PostComment c
  LEFT JOIN users u ON c.commenting_user_id = u.user_id
  LEFT JOIN LatestProfileMedia lpm ON c.commenting_user_id = lpm.user_id AND lpm.rn = 1 -- Sửa chỗ này
  LEFT JOIN SubPostComment sc ON c.comment_id = sc.comment_id
  LEFT JOIN users su ON sc.replying_user_id = su.user_id
  LEFT JOIN LatestProfileMedia la ON sc.replying_user_id = la.user_id AND la.rn = 1
  WHERE c.post_id = ?
  ORDER BY c.created_at DESC, sc.created_at ASC;
        `;

      const [rows] = await pool.execute(query, [post_id]);

      // Tổ chức dữ liệu để lồng sub-comments vào từng comment cấp 1
      const commentsMap = {};

      rows.forEach((row) => {
        const {
          comment_id,
          post_id,
          commenting_user_id,
          comment_text,
          media_link,
          comment_created_at,
          commenting_user_name,
          avatar,
          sub_comment_id,
          replying_user_id,
          sub_comment_text,
          sub_media_link,
          sub_comment_created_at,
          replying_user_name,
          replying_user_avatar,
        } = row;

        // Nếu comment chưa tồn tại trong commentsMap, khởi tạo nó
        if (!commentsMap[comment_id]) {
          commentsMap[comment_id] = {
            comment_id,
            post_id,
            commenting_user_id,
            comment_text,
            media_link,
            created_at: comment_created_at,
            commenting_user_name,
            avatar,
            sub_comments: [],
          };
        }

        // Nếu có sub-comment, thêm vào mảng sub_comments
        if (sub_comment_id) {
          commentsMap[comment_id].sub_comments.push({
            sub_comment_id,
            replying_user_id,
            comment_text: sub_comment_text,
            media_link: sub_media_link,
            created_at: sub_comment_created_at,
            replying_user_name,
            replying_user_avatar,
          });
        }
      });

      // Chuyển từ object map thành array
      return Object.values(commentsMap);
    } catch (error) {
      console.error("Error fetching comments with sub-comments:", error);
      throw error;
    }
  }
}

export default PostComment;
