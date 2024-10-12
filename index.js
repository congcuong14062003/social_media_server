import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import RouterMain from "./app/routers/router.js";
import { ExpressPeerServer } from "peer";
import logger from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { initializeSocket } from "./configs/socketIO/socketManager.js";


dotenv.config();
const app = express();


app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const PORT = process.env.PORT || 5000;
const hostClient = "http://localhost:3001";

// Cấu hình CORS cho server
app.use(
  cors({
    origin: hostClient, // URL của React app
    credentials: true,
  })
);
// Tạo danh sách người dùng
let users = [];

// Khởi tạo server HTTP
const server = createServer(app);

// Khởi tạo PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

// Sử dụng PeerJS server tại endpoint `/peerjs`
app.use('/peerjs', peerServer);
const io = initializeSocket(server, users);

export { io, users};

// Khởi động server HTTP
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Router API
app.use("/apis", RouterMain(express.Router()));
