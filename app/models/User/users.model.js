import pool from "../../../configs/database/database.js";
import {
  compareHash,
  decryptAES,
  encryptAES,
  generateId,
  hashString,
} from "../../ultils/crypto.js";
import crypto from "crypto";
const { generateKeyPairSync } = require("crypto");

class Users {
  constructor(data) {
    this.user_id = data.user_id;
    this.user_name = data.user_name;
    this.user_email = data.user_email;
    this.user_password = data.user_password;
    this.user_status = data.user_status || 1;
    this.type_account = data.type_account;
    this.created_at = data.created_at || Date.now();
    this.user_role = data.user_role || 0;
  }

  async create() {
    try {
      const user_id = this.user_id ?? generateId("uid_");
      const createUserQuery =
        "INSERT INTO users (user_id, user_name, user_email, user_password, user_status, user_role, type_account) VALUES (?, ?, ?, ?, ?, ?, ?);";
      const [result] = await pool.execute(createUserQuery, [
        user_id,
        this.user_name,
        this.user_email,
        await hashString(this.user_password),
        this.user_status,
        this.user_role,
        this.type_account || "register",
      ]);
      return result.affectedRows ? user_id : null;
    } catch (error) {
      console.error("Database error:", error); 
      return false;
    }
  }

  static async getIdByEmail(email, type_account) {
    try {
      const getUserByIdQuery =
        "SELECT user_id FROM Users WHERE user_email = ? AND type_account = ?";
      const [result] = await pool.execute(getUserByIdQuery, [email, type_account]);
      return result[0];
    } catch (error) {
      console.log(error.message);
      return error;
    }
  }

  // tìm người dùng
  static async login(email, password, type_account) {
    try {
        const getUserQuery = "SELECT * FROM Users WHERE user_email = ? AND type_account = ?";
        const [result] = await pool.execute(getUserQuery, [
            email,
            type_account
        ]);
        if (result.length === 0) {
            return false;
        }

        const user = result[0];
        const isPasswordValid = compareHash(password, user.user_password);
        return isPasswordValid ? user : false;
    } catch (error) {
        console.log(error.message);
        return error;
    }
}
  
  async updatePassword(newPassword) {
    try {
        const updatePasswordQuery = "UPDATE Users SET user_password = ? WHERE user_email = ?";
        const [result] = await pool.execute(updatePasswordQuery, [
            await hashString(newPassword),
            this.user_email
        ]);
        return result.affectedRows;
    } catch (error) {
        console.log(error.message);
        return error;
    }
}
static async loginWithUserID(userID, password, type_account) {
  try {
      const getUserQuery = "SELECT * FROM Users WHERE user_id = ? AND type_account = ?" ;
      const [result] = await pool.execute(getUserQuery, [
          userID, 
          type_account
      ]);
      if (result.length === 0) {
          return false;
      }

      const user = result[0];
      const isPasswordValid = compareHash(password, user.user_password);
      return isPasswordValid ? user : false;
  } catch (error) {
      console.log(error.message);
      return error;
  }
}
  // tìm người dùng theo id
  static async getById(user_id) {
    try {
      const getUserByIdQuery = "SELECT *  FROM users  WHERE user_id = ?";
      const [result] = await pool.execute(getUserByIdQuery, [user_id]);
      return result[0];
    } catch (error) {
      console.log(error.message);
      return error;
    }
  }
  static async findUserById(id_user) {
    try {
      const findUserQuery = "SELECT * FROM users WHERE user_id = ?";
      const [rows] = await pool.execute(findUserQuery, [id_user]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  }
  static async getAllUser(user_id) {
    try {
      const findUserQuery = "SELECT * FROM users WHERE user_id != ?";
      const [rows] = await pool.execute(findUserQuery, [user_id]);
      return rows.length > 0 ? rows : null;
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  }

  // check email address
  static async checkEmailExists(email) {
    try {
      const checkEmailQuery =
        "SELECT COUNT(*) as count FROM users WHERE user_email = ? and type_account = 'register';";
      const [rows] = await pool.execute(checkEmailQuery, [email]);
      return rows[0].count > 0;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }

  async update() {
    try {
      let updateUserQuery = "UPDATE Users SET";
      let params = [];
      let updates = [];

      if (this.user_name !== undefined) {
        updates.push(" user_name = ?");
        params.push(this.user_name);
      }

      // if (this.user_email !== undefined) {
      //   updates.push(" user_email = ?");
      //   params.push(this.user_email);
      // }

      // Nếu không có trường nào được cập nhật
      if (updates.length === 0) {
        throw new Error("Không có trường nào được cập nhật.");
      }

      updateUserQuery += updates.join(", ");
      updateUserQuery += " WHERE user_id = ?";
      params.push(this.user_id);

      const [result] = await pool.execute(updateUserQuery, params);

      return result.affectedRows;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
}

class UserKeyPair extends Users {
  constructor(data) {
    super(data);
    this.private_key = data.private_key;
    this.public_key_encode = data.public_key_encode;
  }

  static async generateKeyPair(user_id, code) {

    try {
      const existingKeyPair = await this.getKeyPair(user_id);

      if (!existingKeyPair?.user_id) {
        const { publicKey, privateKey } = generateKeyPairSync("rsa", {
          modulusLength: 4096,
          publicKeyEncoding: { type: "spki", format: "pem" },
          privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });

        const privateKeyEncode = encryptAES(privateKey, code);
        const createKeyPairQuery =
          "INSERT INTO userkeypair (user_id, public_key, private_key_encode) VALUES(?,?,?)";

        const [result] = await pool.execute(createKeyPairQuery, [
          user_id,
          publicKey,
          privateKeyEncode,
        ]);

        return result.affectedRows > 0;
      }
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  }

  // Lấy cặp khoá
  static async getKeyPair(user_id) {
    try {
      const findUserQuery = "SELECT * FROM userkeypair WHERE user_id = ?;";
      const [rows] = await pool.execute(findUserQuery, [user_id]);

      // Log the result of the query

      // Check if rows exist and return the first one
      if (rows.length > 0) {
        return rows[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error("Database error:", error);
      return null;
    }
  }
  // Giải mã và lấy khoá bí mật
  static async checkPrivateKey(user_id, code) {
    try {
      const keyPair = await this.getKeyPair(user_id);


      if (keyPair) {
        const privateKeyDecode = decryptAES(keyPair.private_key_encode, code);

        if (privateKeyDecode !== null) {
          return {
            private_key: privateKeyDecode,
          };
        }
      }
      return null;
    } catch (error) {
      console.log(error.message);
      return null;
    }
  }

  // xoá cặp khoá
  static async deleteKeysPair(user_id) {
    try {
      const deleteUserQuery = "DELETE FROM userkeypair WHERE user_id = ?;";
      const [result] = await pool.execute(deleteUserQuery, [user_id]);

      // Kiểm tra số hàng bị ảnh hưởng (số hàng bị xóa)
      if (result.affectedRows > 0) {
        return true; // Xóa thành công
      } else {
        return false; // Không có hàng nào bị xóa
      }
    } catch (error) {
      console.error("Database error:", error);
      return null; // Lỗi trong quá trình thực thi
    }
  }
}

export { Users, UserKeyPair };
