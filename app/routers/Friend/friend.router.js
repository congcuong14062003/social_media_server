import {
  AcceptFriend,
  addFriend,
  cancelFriendRequest,
  checkFriend,
  checkFriendRequest,
  findAllFriend,
  findAllFriendSuggest,
  findAllInvitedFriendSuggest,
  ListFriendInvite,
} from "../../controllers/Friend/friend.controller.js";
import Authentication from "../../middleware/authentication.js";
import { Authorization } from "../../middleware/authorization_token.js";
import express from "express";
const router = express.Router();
export default function FriendRouter() {
  router.get("/list-friends", Authentication, Authorization, findAllFriend);
  router.get("/list-friends-suggest", Authentication, Authorization, findAllFriendSuggest);
  router.get("/list-invited-friends-suggest", Authentication, Authorization, findAllInvitedFriendSuggest);

  router.get(
    "/list-friend-invite",
    Authentication,
    Authorization,
    ListFriendInvite
  );
  router.post(
    "/accept-add-friend/:id",
    Authentication,
    Authorization,
    AcceptFriend
  );
  router.post("/add-friend/:id", Authentication, Authorization, addFriend);

  router.get("/check-friend/:id", Authentication, Authorization, checkFriend);

  router.get(
    "/check-request/:id",
    Authentication,
    Authorization,
    checkFriendRequest
  );
  router.post(
    "/cancel-request/:id",
    Authentication,
    Authorization,
    cancelFriendRequest
  );
  return router;
}
