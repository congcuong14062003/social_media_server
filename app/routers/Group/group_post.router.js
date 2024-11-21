import { Router } from "express";
import Authentication from "../../middleware/authentication";
import { Authorization, checkPrivacyGroup, checkRoleGroup } from "../../middleware/authorization_token";
import { createGroupPost, getAllAcceptedGroupPosts, getAllGroupPosts, getAllUnapprovedGroupPosts, updateGroupPostStatus } from "../../controllers/Group/group_post.controller";

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
    checkPrivacyGroup,
    getAllAcceptedGroupPosts
  );
  router.get(
    "/list-post-all-group",
    Authentication,
    Authorization,
    getAllGroupPosts
  );
  router.get(
    "/list-post-unapproved/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([0,1]),
    getAllUnapprovedGroupPosts
  );

  router.post(
    "/accept-post/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    updateGroupPostStatus
  );
  router.post(
    "/refuse-post/:group_id",
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    updateGroupPostStatus
  );
  return router;
};

export default GroupPostRouter;
