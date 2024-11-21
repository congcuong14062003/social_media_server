import { Router } from "express";

import {
  acceptInviteByMember,
  checkRoleMember,
  getGroupsByUserID,
  getMemberGroupsByGroupID,
  getMemberGroupsOfficalByGroupID,
  getMemberGroupsUnapprovedByGroupID,
  leaverGroup,
  listSuggestGroup,
  refuseInviteByMember,
  sendInviteByMember,
  setAdminGroup,
} from "../../controllers/Group/group_member.controller";
import Authentication from "../../middleware/authentication";
import {
  Authorization,
  checkRoleGroup,
} from "../../middleware/authorization_token";
// Cấu hình router
const GroupMemberRouter = (router = Router()) => {
  router.get(
    "/list-all-group/:user_id",
    Authentication,
    Authorization,
    getGroupsByUserID
  );
  router.get(
    "/list-all-group/",
    Authentication,
    Authorization,
    getGroupsByUserID
  );

  router.get(
    "/list-members-group/:id",
    Authentication,
    Authorization,
    getMemberGroupsByGroupID
  );
  router.get(
    "/list-members-offical-group/:id",
    Authentication,
    Authorization,
    getMemberGroupsOfficalByGroupID
  );
  router.get(
    "/list-members-unapproved-group/:id",
    Authentication,
    Authorization,
    getMemberGroupsUnapprovedByGroupID
  );
  router.post(
    "/invited-group/:id",
    Authentication,
    Authorization,
    sendInviteByMember
  );

  router.post(
    "/accept-invited-group/:id",
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    acceptInviteByMember
  );

  router.post(
    "/set-admin-group/:id",
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    setAdminGroup
  );

  router.post(
    "/refuse-invited-group/:id",
    Authentication,
    Authorization,
    checkRoleGroup([1]),
    refuseInviteByMember
  );
  // rời nhóm
  router.post(
    "/leave-group/:id",
    Authentication,
    Authorization,
    checkRoleGroup([0, 1]),
    leaverGroup
  );
  // danh sách nhóm gợi ý
  router.get(
    "/list-suggest-group",
    Authentication,
    Authorization,
    listSuggestGroup
  );

  router.get("/check-role/:id", Authentication, Authorization, checkRoleMember);
  return router;
};

export default GroupMemberRouter;
