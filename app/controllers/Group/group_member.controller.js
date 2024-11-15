import GroupChannel from "../../models/Group/group_channel.model";
import GroupMember from "../../models/Group/group_member.model";

export const getGroupsByUserID = async (req, res) => {
  try {
    const user_id = req.params?.user_id || req.body?.data?.user_id;

    const groupsID = await GroupMember.getAllGroupByMemberID(user_id);
    const listGroups = await Promise.all(
      groupsID?.map(
        async (group_id) =>
          await GroupChannel.getGroupByGroupId(group_id?.group_id)
      )
    );
    console.log("groupsID: ", groupsID);
    
    res.status(200).json({ status: true, data: listGroups });
  } catch (error) {
    console.log(error);

    res.status(404).json({ status: false, message: error.message });
  }
};

export const getMemberGroupsByGroupID = async (req, res) => {
  try {
    const groupId = req.params?.id;
    if (!groupId) {
      return res
        .status(400)
        .json({ status: false, message: "Group này không tồn tại" });
    }

    const groupMembers = await GroupMember.getAllMemberByGroupId(groupId);
    if (groupMembers.length) {
      res.status(200).json({ status: true, data: groupMembers });
    }
    res.status(404).json({ status: false });
  } catch (error) {
    console.log(error);

    res.status(404).json({ status: false, message: error.message });
  }
};

export const getMemberGroupsOfficalByGroupID = async (req, res) => {
  try {
    const groupId = req.params?.id;
    if (!groupId) {
      return res
        .status(400)
        .json({ status: false, message: "Group này không tồn tại" });
    }

    const groupMembers = await GroupMember.getAllOfficialMemberByGroupId(
      groupId
    );

    if (groupMembers.length) {
      return res.status(200).json({ status: true, data: groupMembers });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ status: false, message: error.message });
  }
};

export const getMemberGroupsUnapprovedByGroupID = async (req, res) => {
  try {
    const groupId = req.params?.id;
    if (!groupId) {
      return res
        .status(400)
        .json({ status: false, message: "Group này không tồn tại" });
    }

    const groupMembers = await GroupMember.getAllMemberUnapprovedByGroupId(
      groupId
    );
    if (groupMembers.length) {
      return res.status(200).json({ status: true, data: groupMembers });
    }
  } catch (error) {
    console.log(error);

    return res.status(404).json({ status: false, message: error.message });
  }
};

export const checkRoleMember = async (req, res) => {
  try {
    const groupId = req.params?.id ?? req.params?.group_id;
    const user_id = req.body?.data?.user_id;

    if (!groupId) {
      return res
        .status(400)
        .json({ status: false, message: "Group này không tồn tại" });
    }

    const roleMember = await GroupMember.checkRole(user_id, groupId);
    if (roleMember) {
      return res.status(200).json({ status: true, data: roleMember });
    }

    return res.status(404).json({ status: false });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ status: false, message: error.message });
  }
};

export const sendInviteByMember = async (req, res) => {
  try {
    const groupId = req.params?.id;
    const user_id = req.body?.data?.user_id;

    if (!groupId) {
      return res
        .status(400)
        .json({ status: false, message: "Group này không tồn tại" });
    }

    const isInvited = await GroupMember.checkRole(user_id, groupId);

    if (isInvited) {
      return res.status(200).json({
        status: true,
        message: "Bạn đã gửi lời mời, chờ quản trị viên duyệt!",
      });
    }
    const groupMembers = new GroupMember({
      group_id: groupId,
      member_id: user_id,
      member_status: 0,
      member_role: 0,
    });
    const isCreated = await groupMembers.create();
    if (isCreated > 0) {
      return res.status(200).json({ status: true });
    }
    res
      .status(404)
      .json({ status: false, message: "Lỗi khi gửi lời mời tham gia nhóm" });
  } catch (error) {
    console.log(error);

    res.status(404).json({ status: false, message: error.message });
  }
};

export const acceptInviteByMember = async (req, res) => {
  try {
    const groupId = req.params?.id;
    const member_id = req.body?.member_id;

    if (!groupId || !member_id) {
      return res.status(400).json({
        status: false,
        message: "Group hoặc thành viên này không tồn tại",
      });
    }

    const isInvited = await GroupMember.checkRole(member_id, groupId);

    if (isInvited?.member_status === 1) {
      return res.status(200).json({
        status: true,
        message: "Người dùng này đã tham gia nhóm!",
      });
    }

    const isAccepted = await GroupMember.updateAcceptInvite(member_id, groupId);
    if (isAccepted > 0) {
      return res.status(200).json({ status: true });
    }
    res
      .status(404)
      .json({
        status: false,
        message: "Lỗi khi chấp nhận lời mời tham gia nhóm",
      });
  } catch (error) {
    res.status(404).json({ status: false, message: error.message });
  }
};

export const setAdminGroup = async (req, res) => {
  try {
    const groupId = req.params?.id;
    const member_id = req.body?.member_id;

    if (!groupId || !member_id) {
      return res.status(400).json({
        status: false,
        message: "Group hoặc thành viên này không tồn tại",
      });
    }

    const isInvited = await GroupMember.checkRole(member_id, groupId);

    if (isInvited?.member_status === 0) {
      return res.status(200).json({
        status: true,
        message: "Người dùng này chưa tham gia nhóm!",
      });
    }

    const isUpdate = await GroupMember.updateSetAdmin(member_id, groupId);
    if (isUpdate > 0) {
      return res.status(200).json({ status: true });
    }
    res
      .status(404)
      .json({
        status: false,
        message: "Lỗi khi chấp nhận lời mời tham gia nhóm",
      });
  } catch (error) {
    res.status(404).json({ status: false, message: error.message });
  }
};

export const refuseInviteByMember = async (req, res) => {
  try {
    const groupId = req.params?.id;

    const member_id = req.body?.member_id;

    if (!groupId || !member_id) {
      return res.status(400).json({
        status: false,
        message: "Group hoặc thành viên này không tồn tại",
      });
    }

    const isRefuse = await GroupMember.updateRefuseInvite(member_id, groupId);
    if (isRefuse > 0) {
      return res.status(200).json({ status: true });
    }
    res
      .status(404)
      .json({
        status: false,
        message: "Lỗi khi từ chối lời mời tham gia nhóm",
      });
  } catch (error) {
    res.status(404).json({ status: false, message: error.message });
  }
};
