import pool from "../../../configs/database/database";
import sendMail from "../../../configs/emailSTMT/email.config";
import { generateRandomString } from "../../ultils/crypto";


class EmailOTP {

    constructor(data) {
        this.user_email = data.user_email;
        this.otp_code = data.otp_code || generateRandomString(5);
        this.created_at = data.created_at;
        this.otp_expiration = data.otp_expiration;
        this.is_verified = data.is_verified || false;
    }

    // Phương thức tạo OTP
    async create(type) {
        try {
            const createdAt = new Date(); // Thời gian tạo là thời gian hiện tại
            const otpExpiration = new Date(createdAt.getTime() + 1 * 60 * 1000); // Thời gian hết hạn là 1 phút sau thời gian tạo
            const createOTPQuery = "INSERT INTO EmailOTP (user_email, otp_code, otp_expiration, is_verified, created_at) VALUES (?, ?, ?, ?, ?);";
            const result = await pool.execute(createOTPQuery, [
                this.user_email,
                this.otp_code,
                otpExpiration,
                this.is_verified,
                createdAt,
            ]);
            await sendMail(this.user_email, this.otp_code, type);
            return result.affectedRows;
        } catch (error) {
            console.error('Error creating OTP:', error);
            return false;
        }
    }


    static async find(user_email, input_code_otp) {
        try {
            const findOTPQuery = "SELECT * FROM EmailOTP WHERE user_email = ? AND otp_code = ?;";
            const [result] = await pool.execute(findOTPQuery, [
                user_email,
                input_code_otp,
            ]);
            return result.length > 0 ? result[0] : false;
        } catch (error) {
            return false;
        }
    }

    // Phương thức kiểm tra hạn OTP và xóa nếu hết hạn
    async isExpiredAndDelete() {
        const now = new Date();
        const otpExpiration = new Date(this.otp_expiration);

        const isExpired = now > otpExpiration;

        if (isExpired) {
            await this.delete();
            return true;
        }
        return false;
    }




    // Phương thức cập nhật trạng thái
    async updateStatus(is_verified) {
        try {
            const updateStatusQuery = "UPDATE EmailOTP SET is_verified = ? WHERE user_email = ? AND otp_code = ?;";
            const result = await pool.execute(updateStatusQuery, [
                is_verified,
                this.user_email,
                this.otp_code
            ]);
            return result.affectedRows;
        } catch (error) {
            console.error('Error updating OTP status:', error);
            return false;
        }
    }

    // Phương thức xóa OTP
    async delete() {
        try {
            const deleteOTPQuery = "DELETE FROM EmailOTP WHERE user_email = ? AND otp_code = ?;";
            const result = await pool.execute(deleteOTPQuery, [
                this.user_email,
                this.otp_code
            ]);
            return result.affectedRows;
        } catch (error) {
            console.error('Error deleting OTP:', error);
            return false;
        }
    }

    // Phương thức xác thực email và kiểm tra OTP
    async verifyAndDelete(inputOtpCode) {
        try {
            if (await this.isExpiredAndDelete()) {
                return "Mã xác thực đã hết hạn!";
            }
            if (this.otp_code === inputOtpCode) {
                await this.updateStatus(true);
                await this.delete();
                return true;
            } else {
                return "Mã xác thực không đúng hoặc không hợp lệ";
            }
        } catch (error) {
            return error;
        }
    }
}

export {
    EmailOTP
}