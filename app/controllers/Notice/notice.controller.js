import Notice from "../../models/Notice/notice.model.js";
import { ProfileMedia } from "../../models/User/profile_media.model.js";
import { Users } from "../../models/User/users.model.js";

// Thêm thông báo mới
const createNotice = async (req, res) => {
  const { sender_id, receiver_id, content, link_notice, created_at } = req.body;
  const newNotice = new Notice({ sender_id, receiver_id, content, link_notice, created_at});
  try {
    const isCreated = await newNotice.create();
    if (isCreated) {
      res.status(200).json({ status: true});
    } else {
      res.status(400).json({ status: false});
    }
  } catch (error) {
    console.error("Lỗi khi tạo thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};


// Cập nhật trạng thái đọc của thông báo
const markNoticeAsRead = async (req, res) => {
  const notice_id = req.params.id;
  try {
    const isMarked = await Notice.markAsRead(notice_id);
    if (isMarked) {
      res.status(200).json({ status: true, message: "Thông báo đã được đánh dấu là đã đọc" });
    } else {
      res.status(404).json({ status: false, message: "Không tìm thấy thông báo" });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};

// Xoá thông báo
const deleteNotice = async (req, res) => {
  const notice_id = req.params.id;
  try {
    const isDeleted = await Notice.deleteById(notice_id);
    if (isDeleted) {
      res.status(200).json({ status: true, message: "Thông báo đã được xoá thành công" });
    } else {
      res.status(404).json({ status: false, message: "Không tìm thấy thông báo" });
    }
  } catch (error) {
    console.error("Lỗi khi xoá thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
const deleleAllNotice = async (req, res) => {
  const user_id = req.body.data?.user_id;
  try {
    const isDeleted = await Notice.deleteAllNoticeByUser(user_id);
    if (isDeleted) {
      res.status(200).json({ status: true, message: "Thông báo đã được xoá thành công" });
    } else {
      res.status(404).json({ status: false, message: "Không tìm thấy thông báo" });
    }
  } catch (error) {
    console.error("Lỗi khi xoá thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};

const deleleAllNoticeCurrent = async (req, res) => {
  const user_id = req.body.data?.user_id;
  try {
    const isDeleted = await Notice.deleteAllNoticeCurrentByUser(user_id);
    if (isDeleted) {
      res.status(200).json({ status: true});
    } else {
      res.status(404).json({ status: false});
    }
  } catch (error) {
    console.error("Lỗi khi xoá thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};
// Lấy danh sách thông báo của người dùng
const listNoticesByUser = async (req, res) => {
  const user_id = req.body?.data?.user_id;
  try {
    // Lấy danh sách thông báo của người dùng
    const notices = await Notice.getAllByUserId(user_id);

    // Duyệt qua các thông báo và lấy avatar của người tạo thông báo
    for (let notice of notices) {
      const avatar = await ProfileMedia.getLatestAvatarById(notice.sender_id);  // Lấy avatar của người tạo thông báo
      notice.avatar = avatar;  // Thêm avatar vào thông báo
    }

    res.status(200).json({ status: true, data: notices });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};


// Lấy thông tin chi tiết của một thông báo
const getNoticeById = async (req, res) => {
  const notice_id = req.params.id;
  try {
    const notice = await Notice.getById(notice_id);
    if (notice) {
      res.status(200).json({ status: true, data: notice });
    } else {
      res.status(404).json({ status: false, message: "Thông báo không tồn tại" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chi tiết thông báo:", error);
    res.status(500).json({ status: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
  }
};

export {
  createNotice,
  markNoticeAsRead,
  deleteNotice,
  deleleAllNotice,
  deleleAllNoticeCurrent,
  listNoticesByUser,
  getNoticeById,
};
