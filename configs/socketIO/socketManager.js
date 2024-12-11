import { Server } from "socket.io"; // Đảm bảo import đúng Server từ socket.io
import pool from "../database/database";
import { findAllFriendByUserId } from "../../app/controllers/Friend/friend.controller";
import Friend from "../../app/models/Friend/friend.model";
import Notice from "../../app/models/Notice/notice.model";
import GroupMember from "../../app/models/Group/group_member.model";
require("dotenv").config();

let io; // Biến để lưu instance của socket.io

const initializeSocket = (httpServer, users) => {
  if (!io) {
    // Khởi tạo socket với HTTP server
    io = new Server(8900, {
      cors: {
        origin: process.env.HOST || "http://localhost:3001",
      },
    });

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      // Lưu socket ID của người dùng
      socket.on("registerUser", (data) => {
        addUser(socket.id, data?.user_id, users);
        console.log(
          `${data?.user_id} has connected with socket ID: ${socket.id}`
        );
        // Gửi danh sách online hiện tại cho tất cả người dùng
        io.emit("onlineUsers", getAllOnlineUsers(users));
      });
      // Lắng nghe sự kiện khi người dùng logout
      socket.on("userDisconnected", (data) => {
        console.log(`User ${data?.user_id} disconnected.`);
        removeUser(socket.id, users); // Xóa socket khỏi danh sách
        io.emit("onlineUsers", getAllOnlineUsers(users)); // Cập nhật danh sách người dùng online
      });

      // thay đổi sáng tối
      socket.on("dark_theme", async (data) => {
        console.log(data);
        const darkThemeQuery =
          "UPDATE UserSetting SET dark_theme = ? WHERE user_id = ?";
        await pool.execute(darkThemeQuery, [data?.dark_theme, data?.user_id]);
      });
      // Lắng nghe sự kiện đang viết tin nhắn
      socket.on("senderWritting", (data) => {
        const receiverSocketIds = getSocketIdByUserId(data?.receiver_id, users); // Lấy tất cả socketId của người nhận
        if (receiverSocketIds.length > 0) {
          // Lặp qua tất cả socketId của người nhận và phát sự kiện
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiverNotifiWritting", {
              sender_id: data?.sender_id,
              status: data?.status,
            });
          });
        } else {
          console.error(`No socket found for user ID: ${data?.receiver_id}`);
        }
      });

      // Lắng nghe sự kiện xóa tin nhắn
      socket.on("message_delete", (data) => {
        const { messageId, senderId, receiverId, preLastMessage } = data;

        // Nếu xóa tin nhắn cả hai phía, phát sự kiện tới cả người gửi và người nhận
        const senderSockets = getSocketIdByUserId(senderId, users);
        const receiverSockets = getSocketIdByUserId(receiverId, users);

        if (senderSockets.length > 0) {
          senderSockets.forEach((socketId) => {
            io.to(socketId).emit("message_deleted", {
              messageId,
              preLastMessage,
            });
          });
        }

        if (receiverSockets.length > 0) {
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("message_deleted", {
              messageId,
              preLastMessage,
            });
          });
        }
      });

      socket.on("message_delete_owner", (data) => {
        const { messageId, senderId, preLastMessage } = data;
        // Nếu xóa tin nhắn cả hai phía, phát sự kiện tới cả người gửi và người nhận
        const senderSockets = getSocketIdByUserId(senderId, users);
        if (senderSockets.length > 0) {
          senderSockets.forEach((socketId) => {
            io.to(socketId).emit("message_deleted_owner", {
              messageId,
              preLastMessage,
            });
          });
        }
      });

      // Sự kiện đăng bài viết
      socket.on("new_post", async (data) => {
        const { sender_id, link_notice, content, created_at } = data;
        const friends = await Friend.getAllFriends(sender_id);
        console.log("friends: ", friends);

        for (const friend of friends) {
          const friendSocketIds = getSocketIdByUserId(friend?.friend_id, users);
          const newNotice = new Notice({
            sender_id,
            receiver_id: friend?.friend_id,
            content,
            link_notice,
            created_at,
          });

          try {
            const isCreated = await newNotice.create();
            if (isCreated) {
              console.log(
                `Lưu thông báo cho bạn bè ${
                  friendSocketIds.length > 0 ? "online" : "offline"
                }: ${friend.user_name}`
              );
            }
          } catch (error) {
            console.error(
              `Lỗi khi lưu thông báo cho bạn bè ${
                friendSocketIds.length > 0 ? "online" : "offline"
              }:`,
              error
            );
          }

          if (friendSocketIds.length > 0) {
            // Gửi thông báo đến tất cả socketId của bạn bè
            friendSocketIds.forEach((socketId) => {
              io.to(socketId).emit("receiver_notify", {
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });
            });
          }
        }
      });

      // Sự kiện đăng story
      socket.on("new_story", async (data) => {
        console.log("Nhận story mới từ client:", data);

        const { sender_id, content, link_notice, created_at } = data;
        const friends = await Friend.getAllFriends(sender_id);

        for (const friend of friends) {
          const friendSocketIds = getSocketIdByUserId(friend.friend_id, users);
          const newNotice = new Notice({
            sender_id,
            receiver_id: friend?.friend_id,
            content,
            link_notice,
            created_at,
          });

          try {
            const isCreated = await newNotice.create();
            if (isCreated) {
              console.log(
                `Lưu thông báo cho bạn bè ${
                  friendSocketIds.length > 0 ? "online" : "offline"
                }: ${friend.user_name}`
              );
            }
          } catch (error) {
            console.error(
              `Lỗi khi lưu thông báo cho bạn bè ${
                friendSocketIds.length > 0 ? "online" : "offline"
              }:`,
              error
            );
          }

          if (friendSocketIds.length > 0) {
            // Gửi thông báo đến tất cả socketId của bạn bè
            friendSocketIds.forEach((socketId) => {
              io.to(socketId).emit("receiver_notify", {
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });
            });
          }
        }
      });

      // Sự kiện comment bài viết
      socket.on("sendComment", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        console.log("receiver_id: ", receiver_id);

        const receiverSocketIds = getSocketIdByUserId(receiver_id, users);
        console.log("receiverSocketIds: ", receiverSocketIds);

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(
              `Lưu thông báo cho người nhận ${
                receiverSocketIds.length > 0 ? "online" : "offline"
              }: ${receiver_id}`
            );
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo bình luận:", error);
        }

        if (receiverSocketIds.length > 0) {
          // Gửi thông báo đến tất cả socketId của người nhận
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Sự kiện trả lời bình luận
      socket.on("sendSubComment", async (data) => {
        console.log("Có người mới trả lời bình luận của bạn:", data);
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;

        const receiverSocketIds = getSocketIdByUserId(receiver_id, users);
        console.log("receiverSocketIds:", receiverSocketIds);
        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(
              `Lưu thông báo cho người nhận ${
                receiverSocketIds.length > 0 ? "online" : "offline"
              }: ${receiver_id}`
            );
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo trả lời bình luận:", error);
        }

        if (receiverSocketIds.length > 0) {
          // Gửi thông báo đến tất cả socketId của người nhận
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện kết bạn
      socket.on("add_friend", async (data) => {
        console.log("Yêu cầu kết bạn:", data);
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;

        const receiverSocketIds = getSocketIdByUserId(receiver_id, users);
        console.log("receiverSocketIds:", receiverSocketIds);

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(
              `Lưu thông báo cho người nhận ${
                receiverSocketIds.length > 0 ? "online" : "offline"
              }: ${receiver_id}`
            );
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo kết bạn:", error);
        }

        if (receiverSocketIds.length > 0) {
          // Gửi thông báo đến tất cả socketId của người nhận
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện chấp nhận kết bạn
      socket.on("accepted_friend", async (data) => {
        console.log("Chấp nhận kết bạn:", data);
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;

        const receiverSocketIds = getSocketIdByUserId(receiver_id, users);
        console.log("receiverSocketIds:", receiverSocketIds);

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(
              `Lưu thông báo chấp nhận kết bạn cho người nhận ${
                receiverSocketIds.length > 0 ? "online" : "offline"
              }: ${receiver_id}`
            );
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo chấp nhận kết bạn:", error);
        }

        if (receiverSocketIds.length > 0) {
          // Gửi thông báo đến tất cả socketIds của người nhận
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện từ chối kết bạn
      socket.on("declined_friend", async (data) => {
        console.log("Từ chối kết bạn:", data);
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;

        const receiverSocketIds = getSocketIdByUserId(receiver_id, users);
        console.log("receiverSocketIds:", receiverSocketIds);

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(
              `Lưu thông báo từ chối kết bạn cho người nhận ${
                receiverSocketIds.length > 0 ? "online" : "offline"
              }: ${receiver_id}`
            );
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo từ chối kết bạn:", error);
        }

        if (receiverSocketIds.length > 0) {
          // Gửi thông báo đến tất cả socketIds của người nhận
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện tham gia nhóm
      socket.on("join_group", async (data) => {
        console.log("Vào group:", data);

        const { sender_id, link_notice, content, created_at, group_id } = data;
        const adminGroup = await GroupMember.getAllAdminGroup(group_id);

        // Kiểm tra nếu có admin trong group
        if (adminGroup.length > 0) {
          for (const admin of adminGroup) {
            const adminSocketIds = getSocketIdByUserId(admin?.member_id, users); // Lấy tất cả socketId của admin

            const newNotice = new Notice({
              sender_id,
              receiver_id: admin?.member_id,
              content,
              link_notice,
              created_at,
            });

            try {
              const isCreated = await newNotice.create(); // Lưu thông báo cho admin offline
              if (isCreated) {
                console.log(
                  `Lưu thông báo cho admin group: ${admin.user_name}`
                );
              }
            } catch (error) {
              console.error("Lỗi khi lưu thông báo cho admin group:", error);
            }

            // Gửi thông báo qua socket nếu admin đang online
            if (adminSocketIds.length > 0) {
              adminSocketIds.forEach((socketId) => {
                io.to(socketId).emit("receiver_notify", {
                  sender_id,
                  receiver_id: admin?.member_id,
                  content,
                  link_notice,
                  created_at,
                });
              });
            }
          }
        }
      });

      // Lắng nghe sự kiện chấp nhận tham gia nhóm
      socket.on("accepted_join_group", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketIds = getSocketIdByUserId(receiver_id, users); // Lấy tất cả socketId của receiver

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(`Lưu thông báo cho người nhận: ${receiver_id}`);
          }
        } catch (error) {
          console.error(
            "Lỗi khi lưu thông báo chấp nhận tham gia nhóm:",
            error
          );
        }

        // Gửi thông báo qua socket nếu người nhận online
        if (receiverSocketIds.length > 0) {
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện chấp nhận duyệt bài viết
      socket.on("accept_post", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketIds = getSocketIdByUserId(receiver_id, users); // Lấy tất cả socketId của người nhận

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(`Lưu thông báo cho người nhận: ${receiver_id}`);
          }
        } catch (error) {
          console.error(
            "Lỗi khi lưu thông báo chấp nhận duyệt bài viết:",
            error
          );
        }

        // Gửi thông báo qua socket nếu người nhận online
        if (receiverSocketIds.length > 0) {
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện từ chối duyệt bài viết
      socket.on("declined_post", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketIds = getSocketIdByUserId(receiver_id, users); // Lấy tất cả socketId của người nhận

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(`Lưu thông báo cho người nhận: ${receiver_id}`);
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo từ chối duyệt bài viết:", error);
        }

        // Gửi thông báo qua socket nếu người nhận online
        if (receiverSocketIds.length > 0) {
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe sự kiện từ chối tham gia nhóm
      socket.on("decline_join_group", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketIds = getSocketIdByUserId(receiver_id, users); // Lấy tất cả socketId của người nhận

        const newNotice = new Notice({
          sender_id,
          receiver_id,
          content,
          link_notice,
          created_at,
        });

        try {
          const isCreated = await newNotice.create(); // Lưu thông báo vào DB
          if (isCreated) {
            console.log(`Lưu thông báo cho người nhận: ${receiver_id}`);
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo từ chối tham gia nhóm:", error);
        }

        // Gửi thông báo qua socket nếu người nhận online
        if (receiverSocketIds.length > 0) {
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("receiver_notify", {
              sender_id,
              receiver_id,
              content,
              link_notice,
              created_at,
            });
          });
        }
      });

      // Lắng nghe có sự kiện mời vào cuộc gọi
      socket.on("callUser", (data) => {
        const receiverSocketIds = getSocketIdByUserId(data?.receiver_id, users); // Lấy tất cả socketId của người nhận
        if (receiverSocketIds.length > 0) {
          receiverSocketIds.forEach((socketId) => {
            io.to(socketId).emit("user-calling", data); // Gửi thông báo đến tất cả socketId của người nhận
          });
        } else {
          console.error(`No socket found for user ID: ${data?.receiver_id}`);
        }
      });

      socket.on("acceptCallUser", (data) => {
        const { sender_id, receiver_id, status } = data;
        const senderSockets = getSocketIdByUserId(data?.sender_id, users);
        const receiverSockets = getSocketIdByUserId(data?.receiver_id, users);
        if (senderSockets.length > 0 && receiverSockets.length > 0) {
          // Gửi tới tất cả socket của người nhận
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("statusAcceptedCallUser", {
              status: data?.status,
            });
          });

          // Gửi tới tất cả socket của người gửi
          senderSockets.forEach((socketId) => {
            io.to(socketId).emit("statusAcceptedCallUser", {
              status: data?.status,
            });
          });
        } else {
          console.error(
            `No socket found for user IDs: sender=${data?.sender_id}, receiver=${data?.receiver_id}`
          );
        }
        if (status === "Accepted") {
          // io.to(sender_id).emit('statusAcceptedCallUser', { status: 'Accepted' });
          io.emit("user_busy", { status: "Accepted", sender_id, receiver_id });
        }
      });

      // Lắng nghe sự kiện kết thúc cuộc gọi
      socket.on("endCall", (data) => {
        const { receiver_id, sender_id } = data;

        // Tìm socketId của cả người nhận và người gọi
        const receiverSocketIds = getSocketIdByUserId(receiver_id, users);
        const senderSocketIds = getSocketIdByUserId(sender_id, users);

        // Gửi sự kiện "callEnded" đến tất cả socketId của người nhận và người gọi
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("callEnded", { message: "The call has ended." });
        });

        senderSocketIds.forEach((socketId) => {
          io.to(socketId).emit("callEnded", { message: "The call has ended." });
        });

        // In ra thông báo về việc kết thúc cuộc gọi
        console.log(`Call ended between user ${sender_id} and ${receiver_id}`);
      });

      // Chuỗi sự kiện với Peer

      // Nhận peerID người gọi
      socket.on("getPeerIDCaller", (data) => {
        io.to(getSocketIdByUserId(data?.sender_id, users)).emit(
          "sendPeerIDCaller",
          data?.peer_id
        );
      });

      //T  cuộc gọi
      socket.on("statusCall", (data) => {
        const receiverSocketId = getSocketIdByUserId(data?.to, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("statusCallToUser", {
            isCallRemoteAccepted: data.isCallAccepted,
            isVideoRemoteMuted: data?.isVideoMuted,
            isAudioRemoteMuted: data?.isAudioMuted,
          });
        } else {
          console.error(`No socket found for user ID: ${data?.sender_id}`);
        }
      });
      socket.on("disconnect", () => {
        removeUser(socket.id, users);
        io.emit("onlineUsers", getAllOnlineUsers(users));
      });
    });
  }

  return io; // Trả về instance của socket
};

// Hàm thêm người dùng
const addUser = (socketId, userId, users) => {
  const existingUser = users.find((user) => user.userId === userId);
  if (existingUser) {
    // Thêm socketId nếu chưa tồn tại
    if (!existingUser.sockets.includes(socketId)) {
      existingUser.sockets.push(socketId);
    }
  } else {
    // Thêm người dùng mới
    users.push({ userId, sockets: [socketId] });
  }
};

// Hàm xóa người dùng
// const removeUser = (socketId, users) => {
//   const userIndex = users.findIndex((user) => user.socketId === socketId);
//   if (userIndex !== -1) {
//     users.splice(userIndex, 1); // Xóa người dùng khỏi mảng
//   }
// };
const removeUser = (socketId, users) => {
  const userIndex = users.findIndex((user) => user.sockets.includes(socketId));
  if (userIndex !== -1) {
    const user = users[userIndex];
    // Xóa socketId cụ thể
    user.sockets = user.sockets.filter((id) => id !== socketId);

    // Nếu không còn socket nào, xóa luôn user
    if (user.sockets.length === 0) {
      users.splice(userIndex, 1);
    }
  }
};

// Hàm lấy socketId theo userId
// const getSocketIdByUserId = (userId, users) => {
//   const user = users.find((user) => user.userId === userId);
//   return user ? user.socketId : null; // Trả về socketId nếu tìm thấy, nếu không trả về null
// };
const getSocketIdByUserId = (userId, users) => {
  const user = users.find((user) => user.userId === userId);
  return user ? [...new Set(user.sockets)] : []; // Loại bỏ socket trùng lặp
};

// Hàm lấy tất cả người dùng online
const getAllOnlineUsers = (users) => {
  return [...new Set(users.map((user) => user.userId))]; // Loại bỏ trùng lặp
};

export {
  initializeSocket,
  getAllOnlineUsers,
  addUser,
  removeUser,
  getSocketIdByUserId,
};
