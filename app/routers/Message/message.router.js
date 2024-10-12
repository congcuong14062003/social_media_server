import multer from "multer";
import {
  checkExistKeyPair,
  checkExistKeyPairFriend,
  checkSecretDeCryptoPrivateKey,
  createKeyPair,
  createMessage,
  deleteKeysPair,
  getAllConversations,
  getAllMessages,
  updateIsRead,
} from "../../controllers/Message/message.controller.js";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express, { Router } from "express";
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });
export default function MessageRouter(router = Router()) {
  router.post(
    "/send-message/:id",
    upload.array("file", 10),
    Authentication,
    Authorization,
    createMessage
  );
  router.post(
    "/conversations",
    Authentication,
    Authorization,
    getAllConversations
  );

  router.post(
    "/all-messages/:id",
    Authentication,
    Authorization,
    getAllMessages
  );
  router.post("/update-isseen/:messageId", Authentication, Authorization, updateIsRead);
  // kiểm tra tồn tại cặp khoá
  router.get(
    "/check-exists-keypair",
    Authentication,
    Authorization,
    checkExistKeyPair
  );
  // kiểm tra tồn tại cặp khoá
  router.get(
    "/check-exists-keypair-friend/:id",
    checkExistKeyPairFriend
  );
  // tạo cặp khoá
  router.post("/create-keypair", Authentication, Authorization, createKeyPair);

  // lấy khoá bí mật
  router.post(
    "/post-decode-private-key",
    Authentication,
    Authorization,
    checkSecretDeCryptoPrivateKey
  );
  // Xoá cặp khoá
  router.delete(
    "/delete-keypair",
    Authentication,
    Authorization,
    deleteKeysPair
  );
  return router;
}
