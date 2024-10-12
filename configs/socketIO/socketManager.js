import { Server } from "socket.io"; // Đảm bảo import đúng Server từ socket.io
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

      // Lắng nghe sự kiện đang viết tin nhắn
      socket.on("senderWritting", (data) => {
        console.log("Dataaaaaaaaaaaaaaaaaaa: ", data);

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
        console.log(users);

        console.log("data accepted: ", data);
        console.log("socket id:", senderSocketId, receiverSocketId);

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
        console.log("Dataaaaaa: ", data);

        io.to(getSocketIdByUserId(data?.sender_id, users)).emit(
          "sendPeerIDCaller",
          data?.peer_id
        );
      });

      // Khi client ngắt kết nối
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        removeUser(socket.id, users);
        // Cập nhật danh sách online cho tất cả người dùng
        io.emit("onlineUsers", getAllOnlineUsers(users));
      });
      // Xử lý sự kiện ngắt kết nối
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        removeUser(socket.id, users);
        // Cập nhật danh sách online cho tất cả người dùng
        io.emit("onlineUsers", getAllOnlineUsers(users));
        socket.broadcast.emit("callEnded"); // Phát sự kiện khi kết nối bị ngắt
      });
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
