import { io, users } from "../../..";
import uploadFile from "../../../configs/cloud/cloudinary.config";
import pool from "../../../configs/database/database";
import { getSocketIdByUserId } from "../../../configs/socketIO/socketManager";
import Message from "../../models/Message/message.model";
import { UserKeyPair } from "../../models/User/users.model";
import { decryptWithPrivateKey } from "../../ultils/crypto";
const createMessage = async (req, res) => {
  try {
    const files = req.files || {};
    const user_id = req.body?.data?.user_id ?? null;
    const friend_id = req.params?.id ?? null;
    let content_text = req.body?.content_text ?? "";
    const content_type = req.body?.content_type ?? "";
    const reply_text = req.body?.reply_text ?? null;
    const name_file = req.body?.name_file ?? "";
    console.log(files[0]);

    // const friendHasKey = await UserKeyPair.getKeyPair(friend_id);

    // if (!friendHasKey) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "Bạn bè chưa thiết lập tin nhắn vui lòng thử lại sau",
    //   });
    // }

    if (files.length > 0) {
      content_text = (
        await uploadFile(files[0], process.env.NAME_FOLDER_MESSENGER)
      )?.url;
    }

    // Check for missing required fields
    if (!user_id || !friend_id || !content_text) {
      return res
        .status(400)
        .json({ status: false, message: "Dữ liệu nhập vào không hợp lệ" });
    }

    // Create a new message instance
    const newMessage = new Message({
      sender_id: user_id,
      receiver_id: friend_id,
      content_type: content_type,
      reply_text: reply_text,
      name_file: name_file,
    });

    // Attempt to create the message in the database
    const result = await newMessage.create(content_text);

    // Respond based on the result of the message creation
    if (result) {
      // Send message to receiver regardless of database result
      io.to(getSocketIdByUserId(friend_id, users)).emit("receiveMessage", {
        sender_id: user_id,
        receiver_id: friend_id,
        content_text: content_text,
        content_type: content_type,
        name_file: name_file,
        reply_text: reply_text,
      });
      io.to(getSocketIdByUserId(friend_id, users)).emit("updateMessage");
      io.to(getSocketIdByUserId(user_id, users)).emit("updateMessage");
      return res.status(201).json({ status: true });
    } else {
      return res
        .status(500)
        .json({ status: false, message: "Failed to create message" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};
// thay đổi trạng thái is-seen
export const updateIsRead = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.body?.data?.user_id;

    // Gọi model để cập nhật trạng thái is_read
    const result = await Message.updateIsRead(messageId, userId);

    if (result) {
      res.status(200).json({ status: true });
    } else {
      res.status(400).json({ status: false});
    }
  } catch (error) {
    console.error("Error updating is_read:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};
// lấy tất cả tin nhắn của mình mới 1 người nào đó
const getAllMessages = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id ?? null;
    const friend_id = req.params?.id ?? null;
    const private_key = req.body?.private_key ?? "";
    console.log("user_id", user_id);
    console.log("friend_id", friend_id);
    console.log("private_key", private_key);

    if (!user_id || !friend_id || !private_key) {
      return res.status(400).json({ status: false });
    }

    const result = await Message.getMessage(user_id, friend_id);

    const listMsgDecrypt = await Promise.all(
      result.map(async (item) => {
        let content_text = "Encrypted message";

        if (item.sender_id === user_id) {
          content_text = decryptWithPrivateKey(
            item.content_text_encrypt_by_owner,
            private_key
          );
        } else if (item.sender_id === friend_id) {
          content_text = decryptWithPrivateKey(
            item.content_text_encrypt,
            private_key
          );
        }

        return {
          message_id: item.id,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          content_text,
          name_file: item.name_file,
          content_type: item.content_type,
          created_at: item.created_at,
          reply_text: item.reply_text,
        };
      })
    );

    return res.status(200).json({ status: true, data: listMsgDecrypt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};
const getAllConversations = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id ?? null;
    const private_key = req.body?.private_key ?? "";
    if (!user_id) {
      return res
        .status(400)
        .json({ status: false, message: "User ID is required" });
    }

    // Truy vấn để lấy danh sách bạn bè đã có hội thoại với user hiện tại
    const getConversationsQuery = `
SELECT 
  u.user_id AS friend_id,
  u.user_name AS friend_name,
  pm.media_link AS friend_avatar,
  msg.content_text_encrypt,
  msg.content_type,
  msg.name_file,
  msg.content_text_encrypt_by_owner,
  msg.created_at AS last_message_time,
  msg.sender_id,
  msg.receiver_id,
  msg.messenger_id
FROM (
  SELECT 
    *
  FROM 
    PrivateMessage pm
  WHERE 
    (pm.sender_id = ? OR pm.receiver_id = ?)
  AND 
    pm.created_at = (
      SELECT MAX(created_at) 
      FROM PrivateMessage 
      WHERE (sender_id = pm.sender_id AND receiver_id = pm.receiver_id) OR 
            (sender_id = pm.receiver_id AND receiver_id = pm.sender_id)
    )
) AS msg
JOIN users u 
  ON (u.user_id = msg.sender_id OR u.user_id = msg.receiver_id) 
  AND u.user_id != ?
LEFT JOIN (
  SELECT pm1.user_id, pm1.media_link
  FROM ProfileMedia pm1
  WHERE pm1.media_type = 'avatar'
  AND pm1.created_at = (
    SELECT MAX(created_at) 
    FROM ProfileMedia 
    WHERE user_id = pm1.user_id
    AND media_type = 'avatar'
  )
) AS pm
  ON pm.user_id = u.user_id
ORDER BY last_message_time DESC;
    `;

    const [conversations] = await pool.execute(getConversationsQuery, [
      user_id,
      user_id,
      user_id,
    ]);

    // Giải mã các tin nhắn để lấy nội dung hiển thị
    const conversationsWithDecryptedMessages = await Promise.all(
      conversations.map(async (conv) => {
        let content_text = "Encrypted message";

        // Giải mã tin nhắn cuối cùng của bạn bè
        if (conv.sender_id === user_id) {
          content_text = decryptWithPrivateKey(
            conv.content_text_encrypt_by_owner,
            private_key
          );
        } else {
          content_text = decryptWithPrivateKey(
            conv.content_text_encrypt,
            private_key
          );
        }

        return {
          friend_id: conv.friend_id,
          friend_name: conv.friend_name,
          friend_avatar: conv.friend_avatar,
          last_message: content_text,
          content_type: conv.content_type,
          name_file: conv.name_file,
          last_message_time: conv.last_message_time,
          sender_id: conv.sender_id,
          receiver_id: conv.receiver_id,
          messenger_id: conv.messenger_id,
        };
      })
    );

    return res
      .status(200)
      .json({ status: true, data: conversationsWithDecryptedMessages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred, please try again later",
    });
  }
};

// kiểm tra cặp khoá đã tồn tại chưa
const checkExistKeyPair = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const result = await UserKeyPair.getKeyPair(user_id);

    if (result) {
      res.status(200).json({ status: true });
    } else {
      res.status(401).json({
        status: false,
      });
    }
    // Gửi phản hồi về cho client
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: 500, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// kiểm tra cặp khoá của bạn bè đã tồn tại chưa
const checkExistKeyPairFriend = async (req, res) => {
  try {
    const friend_id = req.params?.id ?? null;
    const result = await UserKeyPair.getKeyPair(friend_id);

    if (result) {
      res.status(200).json({ status: true });
    } else {
      res.status(401).json({
        status: false,
      });
    }
    // Gửi phản hồi về cho client
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: 500, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// kiểm tra mã code
const checkSecretDeCryptoPrivateKey = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const code = req.body?.code;
    const result = await UserKeyPair.checkPrivateKey(user_id, code);
    if (result) {
      res.status(200).json({ status: true, data: result });
    } else {
      res.status(401).json({
        status: false,
        message: "Mật khẩu không chính xác vui lòng thử lại",
      });
    }
    // Gửi phản hồi về cho client
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: 500, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// tạo cặp khoá
const createKeyPair = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const code = req.body?.code;
    // const userKeyPair = new UserKeyPair();
    const result = await UserKeyPair.generateKeyPair(user_id, code);
    if (result) {
      res
        .status(201)
        .json({ status: true, message: "Thiết lập mật khẩu thành công" });
    } else {
      res.status(400).json({
        status: false,
        message: "Tạo khoá thất bại, thử lại với mã khác",
      });
    }
    // Gửi phản hồi về cho client
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// xoá cặp khoá
const deleteKeysPair = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;

    if (!user_id) {
      return res
        .status(400)
        .json({ status: false, message: "Missing user_id" });
    }

    const result = await UserKeyPair.deleteKeysPair(user_id);

    if (result) {
      // Nếu xóa thành công
      return res.status(200).json({ status: true });
    } else {
      // Nếu không tìm thấy hoặc không xóa được
      return res.status(404).json({ status: false });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau",
    });
  }
};

export {
  createMessage,
  getAllMessages,
  getAllConversations,
  checkExistKeyPair,
  checkExistKeyPairFriend,
  checkSecretDeCryptoPrivateKey,
  createKeyPair,
  deleteKeysPair,
};
