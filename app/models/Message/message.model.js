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
    this.reply_text = data.reply_text;
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
          reply_text,
          sender_id,
          receiver_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `;

      const [result] = await pool.execute(createMessageQuery, [
        textEnCryptoRSA,
        textEnCryptoRSAForSender,
        this.content_type,
        this.name_file,
        this.reply_text,
        this.sender_id,
        this.receiver_id,
      ]);

      return result.affectedRows > 0;
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
          reply_text,
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
}

export default Message;
