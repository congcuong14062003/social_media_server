import pool from "../../../configs/database/database.js";
import Friend from "../../models/Friend/friend.model.js";
import { Users } from "../../models/User/users.model.js";

// tất cả bạn bè
const findAllFriend = async (req, res) => {
  try {
    // console.log(req.body);
    const user_id = req.body?.data?.user_id;

    const user = await Friend.getAllFriends(user_id);

    if (user) {
      console.log("có user");

      res.status(200).json({ status: true, users: user });
    } else {
      res.status(401).json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: 500, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// tất cả bạn bè gợi ý
const findAllFriendSuggest = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;

    const user = await Friend.getAllFriendsSuggest(user_id);

    if (user) {
      res.status(200).json({ status: true, users: user });
    } else {
      res.status(401).json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: 500, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// tất cả những người mà mình đã gửi lời mời cho họ
const findAllInvitedFriendSuggest = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;

    const user = await Friend.getAllFriendsInvitedSuggest(user_id);

    if (user) {
      res.status(200).json({ status: true, users: user });
    } else {
      res.status(401).json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: 500, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// Hàm gửi lời mời kết bạn
const addFriend = async (req, res) => {
  try {
    const friend_id = req.params.id; // ID của người bạn muốn kết bạn
    const user_id = req.body?.data?.user_id; // ID của người dùng hiện tại (người gửi yêu cầu)

    // Kiểm tra xem người dùng và người bạn có tồn tại không
    const user = await Users.findUserById(user_id);
    const friend = await Users.findUserById(friend_id);

    if (!user || !friend) {
      return res
        .status(401)
        .json({ status: false, message: "Không tồn tại người dùng" });
    }

    // Gửi lời mời kết bạn
    const addFriend = await Friend.addFriendById(user_id, friend_id);
    if (addFriend === 1) {
      return res
        .status(200)
        .json({ status: true, message: "Gửi lời mời kết bạn thành công" });
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Lỗi khi gửi lời mời kết bạn" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, message: error.message ?? error });
  }
};
// chấp nhận lời mời
const AcceptFriend = async (req, res) => {
  try {
    const requestor_id = req.params.id;
    const receiver_id = req.body?.data?.user_id;

    // Kiểm tra sự tồn tại của người gửi và người nhận
    const [checkRequestor, checkReceiver] = await Promise.all([
      Users.getById(requestor_id),
      Users.getById(receiver_id),
    ]);

    if (checkRequestor?.user_id && checkReceiver?.user_id) {
      const result = await Friend.updateStatus(requestor_id, receiver_id, 1);
      if (result === 1) {
        res.status(200).json({
          status: true,
          message: "Các bạn đã trở thành bạn bè, hãy trò chuyện ngay",
        });
      } else {
        res.status(404).json({ status: false, message: "Lỗi bất định" });
      }
    } else {
      throw new Error("Người dùng không tồn tại");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: false, message: error.message ?? error });
  }
};
// kiểm tra đã là bạn chưa
const checkFriend = async (req, res) => {
  try {
    const my_id = req.body?.data?.user_id; // ID của mình
    const user_id = req.params.id; // id người mình muốn check
    console.log("my_id: " + my_id);
    console.log("user_id: " + user_id);
    
    // Gọi hàm kiểm tra bạn bè
    const isFriend = await Friend.isFriend(my_id, user_id);
    console.log("Bạn bè: ", isFriend);
    if (isFriend) {
      res.status(200).json({ status: true, isFriend });
    } else {
      res.status(200).json({ status: false, isFriend });
    }
    // Trả về kết quả
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: false, message: error.message ?? error });
  }
};
// những người gửi kết bạn đến mình
const ListFriendInvite = async (req, res) => {
  try {
    const user_id = req.body?.data?.user_id;
    const user = await Friend.ListInviting(user_id);

    if (user) {
      res.status(200).json({ status: true, users: user });
    } else {
      res.status(401).json({ status: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message ?? error });
  }
};

export async function checkFriendRequest(req, res) {
  const requestor_id = req.params.id;
  const receiver_id = req.body?.data?.user_id;
  try {
    const query = `
          SELECT * FROM friend 
          WHERE requestor_id = ? AND receiver_id = ? 
             OR requestor_id = ? AND receiver_id = ?
      `;
    const [rows] = await pool.execute(query, [
      requestor_id,
      receiver_id,
      receiver_id,
      requestor_id,
    ]);

    // Return status based on whether a request exists
    res.json({ hasRequest: rows.length > 0 });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// huỷ lời mời kết bạn
const cancelFriendRequest = async (req, res) => {
  const requestor_id = req.params.id; // ID của người gửi lời mời
  const receiver_id = req.body?.data?.user_id; // ID của người nhận lời mời (người hiện tại)

  try {
    const result = await Friend.cancelFriendRequest(requestor_id, receiver_id);

    if (result > 0) {
      // Kiểm tra nếu có hàng bị ảnh hưởng
      res
        .status(200)
        .json({ status: true, message: "Huỷ lời mời kết bạn thành công" });
    } else {
      res
        .status(404)
        .json({ status: 404, message: "Lời mời kết bạn không tồn tại" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message ?? error });
  }
};
export {
  findAllFriend,
  findAllFriendSuggest,
  findAllInvitedFriendSuggest,
  addFriend,
  AcceptFriend,
  cancelFriendRequest,
  ListFriendInvite,
  checkFriend,
};
