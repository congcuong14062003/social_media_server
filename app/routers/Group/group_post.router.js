import { Router } from "express";
import Authentication from "../../middleware/authentication";
import { Authorization, checkRoleGroup } from "../../middleware/authorization_token";
import { createGroupPost, getAllAcceptedGroupPosts, getAllUnapprovedGroupPosts } from "../../controllers/Group/group_post.controller";

// Cấu hình router
const GroupPostRouter = (router = Router()) => {
  router.post(
    "/create/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([0,1]),
    createGroupPost
  );
  router.get(
    "/list-post-accepted/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([0,1]),
    getAllAcceptedGroupPosts
  );
  router.get(
    "/list-post-unapproved/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([0,1]),
    getAllUnapprovedGroupPosts
  );
  return router;
};

export default GroupPostRouter;
