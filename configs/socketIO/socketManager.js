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
      socket.on("message_deleted", ({ messageId }) => {
        // Phát lại sự kiện đến các client liên quan (cả người gửi và người nhận)
        io.emit("message_deleted", { messageId });
      });

      // // sự kiện comment bài viết
      socket.on("sendComment", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        // Lấy socketId của người đăng bài từ danh sách người dùng online
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          // Gửi sự kiện 'newCommentNotification' tới người đăng bài
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
        }
      });
      // // sự kiện trả lời bình luận
      socket.on("sendSubComment", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        // Lấy socketId của người đăng bài từ danh sách người dùng online
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          // Gửi sự kiện 'newCommentNotification' tới người đăng bài
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
        }
      });

      // Sự kiện đăng bài viết
      socket.on("new_post", async (data) => {
        const { sender_id, link_notice, content, created_at } = data;
        const friends = await Friend.getAllFriends(sender_id);
        if (friends.length > 0) {
          friends.forEach(async (friend) => {
            // Lấy socketId của bạn bè từ danh sách người dùng online
            const friendSocketId = getSocketIdByUserId(friend.friend_id, users);
            if (friendSocketId) {
              // Gửi thông báo về bài viết mới cho từng người bạn của người đăng bài
              io.to(friendSocketId).emit("receiver_notify", {
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });
            } else {
              // Nếu bạn bè offline, lưu thông báo vào cơ sở dữ liệu để gửi lại sau
              const newNotice = new Notice({
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });

              try {
                const isCreated = await newNotice.create(); // Gọi phương thức create để lưu thông báo
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
        const { sender_id, content, link_notice, created_at } = data;
        console.log("Nhận story mới từ client:", data);

        // Giả sử chúng ta có hàm getFriends để lấy danh sách bạn bè
        const friends = await Friend.getAllFriends(sender_id);
        if (friends.length > 0) {
          friends.forEach(async (friend) => {
            // Lấy socketId của bạn bè từ danh sách người dùng online
            const friendSocketId = getSocketIdByUserId(friend.friend_id, users);
            console.log("friendSocketId:", friendSocketId);
            if (friendSocketId) {
              console.log(
                "Gửi thông báo story mới cho bạn bè:",
                friend.user_name
              );
              // Gửi thông báo về story mới cho từng người bạn của người đăng bài
              io.to(friendSocketId).emit("receiver_notify", {
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });
            } else {
              // Nếu bạn bè offline, lưu thông báo vào cơ sở dữ liệu để gửi lại sau
              const newNotice = new Notice({
                sender_id,
                receiver_id: friend?.friend_id,
                content,
                link_notice,
                created_at,
              });

              try {
                const isCreated = await newNotice.create(); // Gọi phương thức create để lưu thông báo
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

      // lắng nghe sự kiện kết bạn
      socket.on("add_friend", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
        }
      });

      // lắng nghe chấp nhận kết bạn
      socket.on("accepted_friend", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
        }
      });

      // lắng nghe từ chối kết bạn
      socket.on("declined_friend", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
        }
      });

      // lắng nghe sự kiện tham gia nhóm
      socket.on("join_group", async (data) => {
        console.log("vào group");

        const { sender_id, link_notice, content, created_at, group_id } = data;
        const adminGroup = await GroupMember.getAllAdminGroup(group_id);
        if (adminGroup.length > 0) {
          adminGroup.forEach(async (admin) => {
            const adminSocketId = getSocketIdByUserId(admin?.member_id, users);
            if (adminSocketId) {
              io.to(adminSocketId).emit("receiver_notify", {
                sender_id,
                receiver_id: admin?.member_id,
                content,
                link_notice,
                created_at,
              });
            } else {
              const newNotice = new Notice({
                sender_id,
                receiver_id: admin?.member_id,
                content,
                link_notice,
                created_at,
              });

              try {
                const isCreated = await newNotice.create(); // Gọi phương thức create để lưu thông báo
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

      // lắng nghe sự kiện chấp nhận tham gia nhóm
      socket.on("accepted_join_group", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
        }
      });

      
      // lắng nghe sự kiện từ chối tham gia nhóm
      socket.on("decline_join_group", async (data) => {
        const { sender_id, receiver_id, content, link_notice, created_at } =
          data;
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiver_notify", {
            sender_id,
            receiver_id,
            content,
            link_notice,
            created_at,
          });
        } else {
          // Người đăng bài offline, lưu thông báo vào DB
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
                `Lưu thông báo cho người nhận offline: ${receiver_id}`
              );
            }
          } catch (error) {
            console.error("Lỗi khi lưu thông báo bình luận:", error);
          }
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
        const { room_id, receiver_id, sender_id } = data;

        // Lấy socketId của người nhận
        const receiverSocketId = getSocketIdByUserId(receiver_id, users);

        if (receiverSocketId) {
          // Phát sự kiện kết thúc cuộc gọi đến người nhận
          io.to(receiverSocketId).emit("callEnded", {
            message: "The caller has ended the call",
            room_id,
          });
        } else {
          console.error(`No socket found for user ID: ${receiver_id}`);
        }

        // Tương tự, nếu bạn muốn gửi sự kiện này đến người gọi (để đảm bảo cả 2 phía đều xử lý),
        const senderSocketId = getSocketIdByUserId(sender_id, users);
        if (senderSocketId) {
          io.to(senderSocketId).emit("callEnded", {
            message: "You have ended the call",
            room_id,
          });
        } else {
          console.error(`No socket found for user ID: ${sender_id}`);
        }
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
const addUser = (socketId, userId, users) => {
  const existingUser = users.find((user) => user.userId === userId);
  if (existingUser) {
    existingUser.socketId = socketId; // Cập nhật socketId nếu đã tồn tại
  } else {
    users.push({ socketId, userId }); // Thêm người dùng mới
  }
};

// Hàm xóa người dùng
const removeUser = (socketId, users) => {
  const userIndex = users.findIndex((user) => user.socketId === socketId);
  if (userIndex !== -1) {
    users.splice(userIndex, 1); // Xóa người dùng khỏi mảng
  }
};

// Hàm lấy socketId theo userId
const getSocketIdByUserId = (userId, users) => {
  const user = users.find((user) => user.userId === userId);
  return user ? user.socketId : null; // Trả về socketId nếu tìm thấy, nếu không trả về null
};

// Hàm lấy tất cả người dùng online
const getAllOnlineUsers = (users) => {
  return users.map((user) => user.userId);
};

export {
  initializeSocket,
  getAllOnlineUsers,
  addUser,
  removeUser,
  getSocketIdByUserId,
};
