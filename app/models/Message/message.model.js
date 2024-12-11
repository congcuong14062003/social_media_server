import pool from "../../../configs/database/database.js";
import {
  decryptWithPrivateKey,
  encryptWithPublicKey,
  generateRandomString,
} from "../../ultils/crypto.js";
import crypto from "crypto";
import { UserKeyPair } from "../User/users.model.js";

class Message {
  constructor(data) {
    this.messenger_id = data.messenger_id;
    this.content_text_encrypt = data.content_text_encrypt;
    this.content_text_encrypt_by_owner = data.content_text_encrypt_by_owner;
    this.content_type = data.content_type;
    this.reply_id = data.reply_id;
    this.sender_id = data.sender_id;
    this.receiver_id = data.receiver_id;
    this.name_file = data.name_file || null;
    this.created_at = data.created_at;
  }

  static async getPublicKeyReceiver(receiver_id) {
    try {
      const createMessageQuery = `
        SELECT public_key FROM userkeypair
        WHERE 
          (user_id = ?)
      `;

      const [result] = await pool.execute(createMessageQuery, [receiver_id]);

      if (result.length > 0) {
        return {
          public_key: result[0]?.public_key,
        };
      }
      return null;
    } catch (error) {
      console.error("Error creating message: ", error);
      throw error;
    }
  }

  async create(text) {
    try {
      const publicKeyReceiver = await Message.getPublicKeyReceiver(
        this.receiver_id
      ); // Use Message.getPublicKeyReceiver
      const publicKeySender = await Message.getPublicKeyReceiver(
        this.sender_id
      );
      const textEnCryptoRSA = encryptWithPublicKey(
        text,
        publicKeyReceiver.public_key
      );
      const textEnCryptoRSAForSender = encryptWithPublicKey(
        text,
        publicKeySender.public_key
      );
      const createMessageQuery = `
        INSERT INTO PrivateMessage (
          content_text_encrypt,
          content_text_encrypt_by_owner,
          content_type,
          name_file,
          reply_id,
          sender_id,
          receiver_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `;

      const [result] = await pool.execute(createMessageQuery, [
        textEnCryptoRSA,
        textEnCryptoRSAForSender,
        this.content_type,
        this.name_file,
        this.reply_id,
        this.sender_id,
        this.receiver_id,
      ]);

      return result.insertId ?? false;
    } catch (error) {
      console.error("Error creating message: ", error);
      throw error;
    }
  }

  static async getMessage(user_id, friend_id) {
    try {
      const getMessageQuery = `
        SELECT 
          messenger_id,
          content_text_encrypt,
          content_text_encrypt_by_owner,
          content_type,
          name_file,
          reply_id,
          sender_id,
          receiver_id,
          created_at
        FROM PrivateMessage
        WHERE 
          (sender_id = ? AND receiver_id = ?)
          OR 
          (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC;
      `;

      const [result] = await pool.execute(getMessageQuery, [
        user_id,
        friend_id,
        friend_id,
        user_id,
      ]);

      return result;
    } catch (error) {
      console.error("Error fetching messages: ", error);
      throw error;
    }
  }
  static async getMessageByMessengerID(messenger_id) {
    try {
      const getMessageQuery = `
        SELECT 
      *
        FROM PrivateMessage
        WHERE 
        messenger_id = ?;
      `;

      const [result] = await pool.execute(getMessageQuery, [messenger_id]);

      return result;
    } catch (error) {
      console.error("Error fetching messages: ", error);
      throw error;
    }
  }
  static async deleteAllMessage(user_id, friend_id) {
    try {
      // Cập nhật `content_text_encrypt_by_owner` thành NULL nếu user_id là sender
      // và `content_text_encrypt` thành NULL nếu user_id là receiver.
      const deleteMessageQuery = `
        UPDATE PrivateMessage
        SET 
          content_text_encrypt_by_owner = CASE WHEN sender_id = ? THEN NULL ELSE content_text_encrypt_by_owner END,
          content_text_encrypt = CASE WHEN receiver_id = ? THEN NULL ELSE content_text_encrypt END
        WHERE 
          (sender_id = ? AND receiver_id = ?)
          OR 
          (sender_id = ? AND receiver_id = ?);
      `;

      const [result] = await pool.execute(deleteMessageQuery, [
        user_id, // Xoá tin nhắn phía sender
        user_id, // Xoá tin nhắn phía receiver
        user_id,
        friend_id,
        friend_id,
        user_id,
      ]);

      return result?.affectedRows;
    } catch (error) {
      console.error("Error deleting messages on user's side: ", error);
      throw error;
    }
  }
  static async getLastMessage(sender_id, receiver_id) {
    console.log("sender: ", sender_id, receiver_id);

    try {
      const query = `
        SELECT * 
        FROM PrivateMessage
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const [rows] = await pool.execute(query, [
        sender_id,
        receiver_id,
        receiver_id,
        sender_id,
      ]);
      return rows[0]; // Tin nhắn gần nhất
    } catch (error) {
      console.error("Error getting last message: ", error);
      throw error;
    }
  }
  // hàm lấy ra tin nhắn cuối cùng được giải mã bởi chính mình
  static async getLastMessageByOwner(sender_id, receiver_id) {
    try {
      const query = `
       SELECT * 
        FROM PrivateMessage
        WHERE (
            (sender_id = ? AND receiver_id = ?) 
            OR 
            (sender_id = ? AND receiver_id = ?)
        ) 
        AND (content_text_encrypt_by_owner IS NOT NULL AND content_text_encrypt IS NOT NULL)
        ORDER BY created_at DESC
        limit 1
      `;
      const [rows] = await pool.execute(query, [
        sender_id,
        receiver_id,
        receiver_id,
        sender_id,
      ]);
      return rows[0]; // Returning the last valid message
    } catch (error) {
      console.error("Error getting last message by owner: ", error);
      throw error;
    }
  }

  // Sửa hàm deleteMessageByMessageID
  static async deleteMessageByMessageID(user_id, messenger_id) {
    try {
      const [message] = await this.getMessageByMessengerID(messenger_id);
      if (!message) return false;

      const { sender_id, receiver_id } = message;

      if (user_id === sender_id || user_id === receiver_id) {
        const deleteMessageQuery = `DELETE FROM PrivateMessage WHERE messenger_id = ?;`;
        const [result] = await pool.execute(deleteMessageQuery, [messenger_id]);
        return result?.affectedRows > 0;
      }
      return false;
    } catch (error) {
      console.error("Error deleting message by ID: ", error);
      throw error;
    }
  }

  // Sửa hàm deleteMessageByMessageIDOwnSide
  static async deleteMessageByMessageIDOwnSide(user_id, messenger_id) {
    try {
      const [message] = await this.getMessageByMessengerID(messenger_id);
      if (!message) return false;

      const { sender_id } = message;

      // Xóa nội dung tin nhắn cho người gửi hoặc người nhận
      const deleteMessageQuery =
        user_id === sender_id
          ? `UPDATE PrivateMessage SET content_text_encrypt_by_owner = NULL WHERE messenger_id = ?;`
          : `UPDATE PrivateMessage SET content_text_encrypt = NULL WHERE messenger_id = ?;`;

      const [result] = await pool.execute(deleteMessageQuery, [messenger_id]);

      // Nếu là tin nhắn cuối cùng, kiểm tra lại hội thoại
      if (result?.affectedRows > 0) {
        await this.revalidateLastMessage(
          user_id,
          message.sender_id,
          message.receiver_id
        );
      }

      return result?.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting message on user's side: ", error);
      throw error;
    }
  }

  // Hàm hỗ trợ để kiểm tra và cập nhật tin nhắn cuối cùng
  static async revalidateLastMessage(user_id, sender_id, receiver_id) {
    try {
      const checkQuery = `
        SELECT *
        FROM PrivateMessage
        WHERE (sender_id = ? AND receiver_id = ? OR sender_id = ? AND receiver_id = ?)
        AND (content_text_encrypt IS NOT NULL OR content_text_encrypt_by_owner IS NOT NULL)
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const [latestMessage] = await pool.execute(checkQuery, [
        sender_id,
        receiver_id,
        receiver_id,
        sender_id,
      ]);
      if (latestMessage.length > 0) {
        // Update trạng thái hoặc xử lý nếu cần thiết
        console.log(
          "Updated last message for the conversation:",
          latestMessage[0]
        );
      }
    } catch (error) {
      console.error("Error revalidating last message: ", error);
      throw error;
    }
  }

  static async updateIsRead(messageId, userId) {
    try {
      const query = `
        UPDATE PrivateMessage 
        SET is_read = true
        WHERE messenger_id = ? AND receiver_id = ? AND is_read = 0
      `;
      const [result] = await pool.execute(query, [messageId, userId]);
      return result.affectedRows > 0; // Trả về true nếu có dòng được cập nhật
    } catch (error) {
      console.error("Error updating is_read in database:", error);
      throw new Error(error);
    }
  }
  // Update tin nhắn theo ID trong Message model
  static async updateMessageById(userId, messageId, newText) {
    try {
      // Kiểm tra xem tin nhắn có thuộc về người dùng hiện tại không
      const [message] = await this.getMessageByMessengerID(messageId);
      if (!message || message.sender_id !== userId) {
        return false; // Người dùng không có quyền chỉnh sửa tin nhắn này
      }

      // Mã hoá nội dung tin nhắn mới (tuỳ vào yêu cầu của bạn)
      const encryptedText = encryptWithPublicKey(
        newText,
        message.receiver_public_key
      );

      // Thực hiện cập nhật nội dung tin nhắn
      const updateMessageQuery = `
          UPDATE PrivateMessage 
          SET content_text_encrypt_by_owner = ?
          WHERE messenger_id = ? AND sender_id = ?;
      `;
      const [result] = await pool.execute(updateMessageQuery, [
        encryptedText,
        messageId,
        userId,
      ]);

      return result.affectedRows > 0; // Trả về true nếu cập nhật thành công
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  }
}

export default Message;
