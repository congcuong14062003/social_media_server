import nodemailer from 'nodemailer';
require("dotenv").config();
const sendMail = async (email, otp, type) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        service: "Gmail",
        port: 587,
        auth: {
            user: "leaveease.info@gmail.com",
            pass: "ivokdaxqactvrmey",
        },
    });

    let subject;
    let html;
    if (type === 'code') {
        subject = "Xác thực tài khoản - Social Media";
        html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <h2 style="color: #4CAF50;">Social Media</h2>
                    <p>Chào bạn,</p>
                    <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Mã OTP của bạn là:</p>
                    <div style="font-size: 24px; font-weight: bold; margin: 20px 0; padding: 10px; border: 1px dashed #4CAF50; border-radius: 5px; text-align: center; background-color: #f9f9f9;">
                        ${otp}
                    </div>
                    <p>Mã này có hiệu lực trong vòng 1 phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,</p>
                    <p>Đội ngũ Social Media</p>
                    <div style="margin-top: 20px; font-size: 12px; color: #999;">
                        <p>Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi tại <a href="https://www.facebook.com/vlog.ntn.773">Công Cường</a>.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'link') {
        const resetLink = `${process.env.HOST}/login/forgot-password?input_code=${otp}&email=${email}`; // Replace with your actual link generation logic
        subject = "Đặt lại mật khẩu - Social Media";
        html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <h2 style="color: #4CAF50; text-align: center;">Social Media</h2>
                        <p>Chào bạn,</p>
                        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấp vào liên kết dưới đây để đặt lại mật khẩu của bạn:</p>
                        <div style="margin: 20px 0; padding: 10px; border: 1px dashed #4CAF50; border-radius: 5px; text-align: center; background-color: #f9f9f9;">
                            <a href="${resetLink}" style="font-size: 18px; color: white; text-decoration: none; background-color: #4CAF50; padding: 10px 20px; border-radius: 5px;">Đặt lại mật khẩu</a>
                        </div>
                        <p>Liên kết này có hiệu lực trong vòng 1 phút. Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
                        <p>Trân trọng,</p>
                        <p>Đội ngũ Social Media</p>
                        <div style="margin-top: 20px; font-size: 12px; color: #999;">
                            <p>Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi tại <a href="https://www.facebook.com/vlog.ntn.773" style="color: #4CAF50; text-decoration: none;">Công Cường</a>.</p>
                        </div>
                    </div>
                </div>
        `;
    }

    const message = {
        from: '"Social Media" <javier.marquardt@ethereal.email>', // Replace with your actual email
        to: email,
        subject: subject,
        html: html,
    };

    try {
        const result = await transporter.sendMail(message);
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

export default sendMail;
