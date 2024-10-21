import pool from "../../../configs/database/database.js";

class PostMedia {
  constructor(data) {
    this.post_id = data.post_id; // Associated post
    this.media_link = data.media_link; // Link to the media
    this.media_type = data.media_type; // Type of the media (e.g., image, video)
  }

  async create() {
    try {
      const createMediaRequestQuery = `
        INSERT INTO PostMedia (post_id, media_link, media_type)
        VALUES (?, ?, ?);
      `;
      const [result] = await pool.execute(createMediaRequestQuery, [
        this.post_id,
        this.media_link,
        this.media_type,
      ]);

      // Check if rows were affected (insert was successful)
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error while creating post media:", error);
      throw error;
    }
  }

  static async getAllMediaByPostId(post_id) {
    const query = `
      SELECT media_link, media_type
      FROM PostMedia
      WHERE post_id = ?;
    `;

    try {
      const [results] = await pool.execute(query, [post_id]);
      return results;
    } catch (error) {
      console.error("Error fetching media for post:", error);
      throw error;
    }
  }

  static async deleteMedia(media_id) {
    const query = `
      DELETE FROM PostMedia
      WHERE media_id = ?;
    `;

    try {
      const [result] = await pool.execute(query, [media_id]);
      return result.affectedRows > 0; // Return true if a row was deleted
    } catch (error) {
      console.error("Error deleting post media:", error);
      throw error;
    }
  }
}

export default PostMedia;
