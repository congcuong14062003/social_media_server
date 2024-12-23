import { io, users } from "../../..";
import uploadFile from "../../../configs/cloud/cloudinary.config";
import pool from "../../../configs/database/database";
import { getSocketIdByUserId } from "../../../configs/socketIO/socketManager";
import Message from "../../models/Message/message.model";
import { ProfileMedia } from "../../models/User/profile_media.model";
import { UserKeyPair, Users } from "../../models/User/users.model";
import { decryptWithPrivateKey } from "../../ultils/crypto";
const createMessage = async (req, res) => {
  try {
    const files = req.files || {};
    const user_id = (req.body?.sender_id || req.body?.data?.user_id) ?? null;
    const friend_id = req.params?.id ?? null;
    let content_text = req.body?.content_text?.toString() || "";
    const content_type = req.body?.content_type ?? "";
    const reply_id = req.body?.reply_id ?? null;
    const name_file = req.body?.name_file ?? "";

    // Kiểm tra nếu bạn bè chưa thiết lập khóa
    const friendHasKey = await UserKeyPair.getKeyPair(friend_id);
    if (!friendHasKey) {
      return res.status(401).json({
        status: false,
        message: "Bạn bè chưa thiết lập tin nhắn, vui lòng thử lại sau.",
      });
    }

    // Xử lý nếu có file được tải lên
    if (files.length > 0) {
      const uploadedFile = await uploadFile(
        files[0],
        process.env.NAME_FOLDER_MESSENGER
      );
      if (uploadedFile?.url) {
        content_text = uploadedFile.url;
      } else {
        return res.status(500).json({
          status: false,
          message: "Tải lên tệp thất bại, vui lòng thử lại.",
        });
      }
    }

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (!user_id || !friend_id || !content_text) {
      return res.status(400).json({
        status: false,
        message: "Dữ liệu nhập vào không hợp lệ.",
      });
    }

    // Tạo tin nhắn mới
    const newMessage = new Message({
      sender_id: user_id,
      receiver_id: friend_id,
      content_type: content_type,
      reply_id: reply_id,
      name_file: name_file,
      created_at: new Date(),
    });

    const result = await newMessage.create(content_text);
    if (!result) {
      return res.status(500).json({
        status: false,
        message: "Không thể tạo tin nhắn, vui lòng thử lại.",
      });
    }

    // Gửi tin nhắn đến người nhận và người gửi
    const friendSocketIds = getSocketIdByUserId(friend_id, users);
    const senderSocketIds = getSocketIdByUserId(user_id, users);

    const messageData = {
      messenger_id: result,
      sender_id: user_id,
      receiver_id: friend_id,
      content_text: content_text,
      content_type: content_type,
      name_file: name_file,
      reply_id: reply_id,
      created_at: new Date(),
    };

    // Gửi đến tất cả socket của người nhận
    friendSocketIds.forEach((socketId) => {
      io.to(socketId).emit("receiveMessage", messageData);
    });

    // Gửi đến tất cả socket của người gửi
    senderSocketIds.forEach((socketId) => {
      io.to(socketId).emit("receiveMessage", messageData);
    });

    return res.status(201).json({ status: true });
  } catch (error) {
    console.error("Error in createMessage:", error.message);
    return res.status(500).json({
      status: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
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
      res.status(400).json({ status: false });
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
          messenger_id: item.messenger_id,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          content_text,
          name_file: item.name_file,
          content_type: item.content_type,
          created_at: item.created_at,
          reply_id: item.reply_id,
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
const deleteAllMessenger = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const friend_id = req.params?.friend_id;
    if (!user_id || !friend_id) {
      return res
        .status(400)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    const result = await Message.deleteAllMessage(user_id, friend_id);
    if (result <= 0) {
      throw new Error("Lỗi");
    }

    return res.status(200).json({ status: 200 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Opps! Có một chút lỗi nhỏ. Thử lại tác vụ",
    });
  }
};
// Hàm deleteMessenger trong controller
const deleteMessenger = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const messenger_id = req.params?.messenger_id;
    const receiver_id = req.body?.receiver_id;
    const private_key = req.body?.private_key; // Assuming the private key is passed in the request
    if (!user_id) {
      return res
        .status(400)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    const result = await Message.deleteMessageByMessageID(
      user_id,
      messenger_id
    );

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy hoặc không thể xóa tin nhắn",
      });
    }

    // Lấy tin nhắn cuối cùng sau khi xóa
    const lastMessage = await Message.getLastMessage(user_id, receiver_id);

    if (lastMessage) {
      let content_text = "Encrypted message"; // Default content for encrypted message

      // Giải mã tin nhắn cuối cùng
      if (lastMessage.sender_id === user_id) {
        // Tin nhắn gửi bởi người dùng, sử dụng khóa riêng của người nhận
        content_text = decryptWithPrivateKey(
          lastMessage.content_text_encrypt_by_owner,
          private_key
        );
      } else if (lastMessage.sender_id === receiver_id) {
        // Tin nhắn gửi bởi bạn bè, sử dụng khóa riêng của người dùng
        content_text = decryptWithPrivateKey(
          lastMessage.content_text_encrypt,
          private_key
        );
      }

      // Gửi tin nhắn cuối cùng đã giải mã
      return res.status(200).json({
        status: true,
        lastMessage: {
          ...lastMessage,
          content_text, // Gửi tin nhắn cuối cùng đã giải mã
        },
      });
    } else {
      return res.status(200).json({
        status: true,
        lastMessage: null, // Không có tin nhắn cuối cùng
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Opps! Có một chút lỗi nhỏ. Thử lại tác vụ",
    });
  }
};

// Hàm deleteMessengerByOwnerSide trong controller
const deleteMessengerByOwnerSide = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const messenger_id = req.params?.messenger_id;
    const receiver_id = req.body?.receiver_id;
    const private_key = req.body?.private_key;

    if (!user_id) {
      return res
        .status(400)
        .json({ status: false, message: "Người dùng không tồn tại" });
    }

    // Xóa tin nhắn bên người gửi (owner side)
    const result = await Message.deleteMessageByMessageIDOwnSide(
      user_id,
      messenger_id
    );
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Không tìm thấy hoặc không thể xóa tin nhắn",
      });
    }
    // return res.status(200).json({ status: true });
    // Lấy tin nhắn cuối cùng sau khi xóa
    const lastMessage = await Message.getLastMessageByOwner(
      user_id,
      receiver_id
    );

    let content_text = "Encrypted message"; // Nội dung mặc định cho tin nhắn mã hóa

    if (lastMessage) {
      if (lastMessage.sender_id === user_id) {
        // Tin nhắn gửi bởi người dùng, giải mã với khóa riêng của người nhận
        content_text = decryptWithPrivateKey(
          lastMessage.content_text_encrypt_by_owner,
          private_key
        );
      } else if (lastMessage.sender_id === receiver_id) {
        // Tin nhắn gửi bởi bạn bè, giải mã với khóa riêng của người dùng
        content_text = decryptWithPrivateKey(
          lastMessage.content_text_encrypt,
          private_key
        );
      }

      return res.status(200).json({
        status: true,
        lastMessage: {
          ...lastMessage,
          content_text, // Gửi tin nhắn cuối cùng đã giải mã
        },
      });
    } else {
      return res.status(200).json({
        status: true,
        lastMessage: null, // Không có tin nhắn cuối cùng
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Opps! Có một chút lỗi nhỏ. Thử lại tác vụ",
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
      WHERE ((sender_id = pm.sender_id AND receiver_id = pm.receiver_id) OR 
             (sender_id = pm.receiver_id AND receiver_id = pm.sender_id))
      AND (content_text_encrypt IS NOT NULL OR content_text_encrypt_by_owner IS NOT NULL)
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

        // Giải mã tin nhắn cuối cùng của bạn bè, kiểm tra nếu trường có giá trị hợp lệ
        if (conv.sender_id === user_id) {
          content_text = conv.content_text_encrypt_by_owner
            ? decryptWithPrivateKey(
                conv.content_text_encrypt_by_owner,
                private_key
              )
            : "Tin nhắn đã bị gỡ";
        } else {
          content_text = conv.content_text_encrypt
            ? decryptWithPrivateKey(conv.content_text_encrypt, private_key)
            : "Tin nhắn đã bị gỡ";
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
// xửa tin nhắn
const editMessage = async (req, res) => {
  const { messageId } = req.params; // Lấy messageId từ URL
  const { newText } = req.body; // Lấy nội dung tin nhắn mới từ request body
  const userId = req.user.id; // Giả sử bạn đã có `userId` từ session hoặc JWT

  try {
    const isUpdated = await Message.updateMessageById(
      userId,
      messageId,
      newText
    );

    if (isUpdated) {
      res
        .status(200)
        .json({ success: true, message: "Message updated successfully" });
    } else {
      res.status(403).json({
        success: false,
        message: "You are not authorized to edit this message",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating message",
      error: error.message,
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
  deleteAllMessenger,
  deleteMessenger,
  editMessage,
  deleteMessengerByOwnerSide,
  getAllConversations,
  checkExistKeyPair,
  checkExistKeyPairFriend,
  checkSecretDeCryptoPrivateKey,
  createKeyPair,
  deleteKeysPair,
};
