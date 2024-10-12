import crypto from "crypto";
import bcrypt from 'bcrypt';
require("dotenv").config();
const CryptoJS = require("crypto-js");

//Tạo random String với 8 ký tự
export function generateId(prefix) {
  return `${prefix}${crypto.randomBytes(8).toString('hex')}`;
}




//Tạo hàm băm với bcrypt
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);


export async function hashString(input) {
  // Chờ đợi để tạo salt
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  // Chờ đợi để tạo hash
  const hashedString = await bcrypt.hash(input, salt);
  return hashedString;
}

// So sánh hàm băm
export const compareHash = (string, hash) => {
  return bcrypt.compareSync(string, hash);
}

//Tạo randomString với length ký tự
export function generateRandomString(length = 10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;
}


// Khóa bí mật (bạn nên lưu trữ và quản lý khóa này một cách an toàn)
const secretKey = process.env.KEY_AES;

// Hàm mã hóa
export function encryptAES(text, secretKeyAES = secretKey) {
    return CryptoJS.AES.encrypt(text, secretKeyAES).toString();
}

// Hàm giải mã
export function decryptAES(cipherText, secretKeyAES = secretKey) {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKeyAES);
    return bytes.toString(CryptoJS.enc.Utf8);
}



export function encryptWithPublicKey(data, public_key) {
  return crypto.publicEncrypt(public_key, Buffer.from(data)).toString('hex');
}
export function decryptWithPrivateKey(encryptedData, private_key) {
  try {
    return crypto.privateDecrypt(private_key, Buffer.from(encryptedData, 'hex')).toString();
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null; // Hoặc một giá trị khác tùy bạn xử lý khi giải mã thất bại
  }
}

