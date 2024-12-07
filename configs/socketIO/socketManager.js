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
        removeUser(socket.id, users);
        io.emit("onlineUsers", getAllOnlineUsers(users)); // Cập nhật danh sách online
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
        const receiverSocketId = getSocketIdByUserId(data?.receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiverNotifiWritting", {
            sender_id: data?.sender_id,
            status: data?.status,
          });
        } else {
          console.error(`No socket found for user ID: ${data?.receiver_id}`);
        }
      });
      // Lắng nghe sự kiện xoá tin nhắn từ client
      socket.on("message_delete", ({ messageId }) => {
        // Phát lại sự kiện đến các client liên quan (cả người gửi và người nhận)
        io.emit("message_deleted", { messageId });
      });

      // Sự kiện đăng bài viết
      socket.on("new_post", async (data) => {
        console.log("aaaaaaa:", data);

        const { sender_id, link_notice, content, created_at } = data;
        const friends = await Friend.getAllFriends(sender_id);

        if (friends.length > 0) {
          friends.forEach(async (friend) => {
            const friendSocketId = getSocketIdByUserId(friend.friend_id, users);
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
                  `Lưu thông báo cho bạn bè online: ${friend.user_name}`
                );
              }
            } catch (error) {
              console.error("Lỗi khi lưu thông báo cho bạn bè online:", error);
            }

            if (friendSocketId) {
              io.to(friendSocketId).emit("receiver_notify", {
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });
            } else {
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
                    `Lưu thông báo cho bạn bè offline: ${friend.user_name}`
                  );
                }
              } catch (error) {
                console.error(
                  "Lỗi khi lưu thông báo cho bạn bè offline:",
                  error
                );
              }
            }
          });
        }
      });

      // Sự kiện đăng story
      socket.on("new_story", async (data) => {
        console.log("Nhận story mới từ client:", data);

        const { sender_id, content, link_notice, created_at } = data;
        const friends = await Friend.getAllFriends(sender_id);

        if (friends.length > 0) {
          friends.forEach(async (friend) => {
            const friendSocketId = getSocketIdByUserId(friend.friend_id, users);
            console.log("friendSocketId:", friendSocketId);

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
                  `Lưu thông báo cho bạn bè online: ${friend.user_name}`
                );
              }
            } catch (error) {
              console.error("Lỗi khi lưu thông báo cho bạn bè online:", error);
            }

            if (friendSocketId) {
              console.log(
                "Gửi thông báo story mới cho bạn bè:",
                friend.user_name
              );
              io.to(friendSocketId).emit("receiver_notify", {
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });
            } else {
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
                    `Lưu thông báo cho bạn bè offline: ${friend.user_name}`
                  );
                }
              } catch (error) {
                console.error(
                  "Lỗi khi lưu thông báo cho bạn bè offline:",
                  error
                );
              }
            }
          });
        }
      });

      // Sự kiện comment bài viết
      socket.on("sendComment", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

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
          console.error("Lỗi khi lưu thông báo bình luận:", error);
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Sự kiện trả lời bình luận
      socket.on("sendSubComment", async (data) => {
        console.log("Có người mới trả lời bình luận của bạn:", data);
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

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
          console.error("Lỗi khi lưu thông báo bình luận:", error);
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện kết bạn
      socket.on("add_friend", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

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
            console.log(`Lưu thông báo cho người nhận offline: ${receiver_id}`);
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo kết bạn:", error);
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện chấp nhận kết bạn
      socket.on("accepted_friend", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

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
            console.log(`Lưu thông báo cho người nhận offline: ${receiver_id}`);
          }
        } catch (error) {
          console.error("Lỗi khi lưu thông báo chấp nhận kết bạn:", error);
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện từ chối kết bạn
      socket.on("declined_friend", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

        // Tạo thông báo và lưu vào DB ngay cả khi người dùng online
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
          console.error("Lỗi khi lưu thông báo từ chối kết bạn:", error);
        }

        // Gửi thông báo qua socket nếu người dùng online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện tham gia nhóm
      socket.on("join_group", async (data) => {
        console.log("vào group");

        const { sender_id, link_notice, content, created_at, group_id } = data;
        const adminGroup = await GroupMember.getAllAdminGroup(group_id);

        // Tạo và lưu thông báo cho các admin trong nhóm, kể cả khi online
        if (adminGroup.length > 0) {
          adminGroup.forEach(async (admin) => {
            const adminSocketId = getSocketIdByUserId(admin?.member_id, users);

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

            if (adminSocketId) {
              io.to(adminSocketId).emit("receiver_notify", {
                sender_id,
                receiver_id: admin?.member_id,
                content,
                link_notice,
                created_at,
              });
            }
          });
        }
      });

      // Lắng nghe sự kiện chấp nhận tham gia nhóm
      socket.on("accepted_join_group", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

        // Tạo và lưu thông báo cho người nhận, kể cả khi online
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

        // Gửi thông báo qua socket nếu người dùng online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện chấp nhận duyệt bài viết
      socket.on("accept_post", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

        // Tạo và lưu thông báo cho người nhận, kể cả khi online
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

        // Gửi thông báo qua socket nếu người dùng online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện từ chối duyệt bài viết
      socket.on("declined_post", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

        // Tạo và lưu thông báo cho người nhận, kể cả khi online
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

        // Gửi thông báo qua socket nếu người dùng online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe sự kiện từ chối tham gia nhóm
      socket.on("decline_join_group", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

        // Tạo và lưu thông báo cho người nhận, kể cả khi online
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

        // Gửi thông báo qua socket nếu người dùng online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        }
      });

      // Lắng nghe có sự kiện mời vào cuộc gọi
      socket.on("callUser", (data) => {
        const receiverSocketId = getSocketIdByUserId(data?.receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("user-calling", data);
        } else {
          console.error(`No socket found for user ID: ${data?.receiver_id}`);
        }
      });

      // Chấp nhận cuộc gọi
      socket.on("acceptCallUser", (data) => {
        const senderSocketId = getSocketIdByUserId(data?.sender_id, users);
        const receiverSocketId = getSocketIdByUserId(data?.receiver_id, users);
        if (senderSocketId && receiverSocketId) {
          io.to(receiverSocketId).emit("statusAcceptedCallUser", {
            status: data?.status,
          });
          io.to(senderSocketId).emit("statusAcceptedCallUser", {
            status: data?.status,
          });
        } else {
          console.error(`No socket found for user ID: ${data?.sender_id}`);
        }
      });
      // Lắng nghe sự kiện kết thúc cuộc gọi
      socket.on("endCall", (data) => {
        // Ensure you send the event to the other user in the call
        const { receiver_id, sender_id } = data;

        // Find the other user based on their ID and socket ID
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        const senderSocketId = getSocketIdByUserId(sender_id, users);

        // Emit the "endCall" event to the other user
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("callEnded", {
            message: "The call has ended.",
          });
        }

        if (senderSocketId) {
          io.to(senderSocketId).emit("callEnded", {
            message: "The call has ended.",
          });
        }

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

      // Khi client ngắt kết nối
      socket.on("disconnect", () => {
        removeUser(socket.id, users);
        // Cập nhật danh sách online cho tất cả người dùng
        io.emit("onlineUsers", getAllOnlineUsers(users));
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
      // Lắng nghe sự kiện gửi bình luận
      // socket.on("sendComment", (data) => {
      //   // Phát sự kiện bình luận mới đến tất cả client
      //   console.log("data comment: ", data);

      //   io.emit("newComment", data);
      // });
    });
  }

  return io; // Trả về instance của socket
};

// Hàm thêm người dùng
// const addUser = (socketId, userId, users) => {
//   const existingUser = users.find((user) => user.userId === userId);
//   if (existingUser) {
//     existingUser.socketId = socketId; // Cập nhật socketId nếu đã tồn tại
//   } else {
//     users.push({ socketId, userId }); // Thêm người dùng mới
//   }
// };
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
    // Xóa socketId
    user.sockets = user.sockets.filter((id) => id !== socketId);

    // Nếu không còn socketId nào, xóa người dùng
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
  return user ? user.sockets : []; // Trả về mảng socketId hoặc mảng rỗng
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
