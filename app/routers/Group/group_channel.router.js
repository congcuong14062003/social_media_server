import { Router } from "express";
import multer from "multer";
import {
  createGroupChannel,
  deleteGroup,
  getInfoGroupChannel,
  listSuggestGroup,
  updateGroup,
} from "../../controllers/Group/group_channel.controller";
import Authentication from "../../middleware/authentication";
import { Authorization, checkRoleGroup } from "../../middleware/authorization_token";
// Cấu hình Multer để xử lý nhiều trường ảnh
const storage = multer.memoryStorage(); // Bạn có thể thay đổi sang multer.diskStorage() nếu cần
const upload = multer({ storage });

// Cấu hình router
const GroupChannelRouter = (router = Router()) => {
  router.post(
    "/create/",
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "cover", maxCount: 1 },
    ]),
    Authentication,
    Authorization,
    createGroupChannel
  );

  router.get("/details/:group_id", getInfoGroupChannel);
  router.post(
    "/update/:group_id",
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "cover", maxCount: 1 },
    ]),
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    updateGroup
  );
  router.delete(
    "/delete/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    deleteGroup
  );
 
  return router;
};

export default GroupChannelRouter;
