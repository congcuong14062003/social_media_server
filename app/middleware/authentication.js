import { Token } from "../models/Token/token.js";
import { Users } from "../models/User/users.model.js";
import { encryptAES, generateRandomString } from "../ultils/crypto.js";
require("dotenv").config();

export default async function Authentication(req, res, next) {
  try {
    const access_token = req.headers?.authorization?.split(" ")[1];

    //Login với token
    if (access_token) {
      const isValidated = await Token.validate(access_token);

      if (isValidated.valid) {
        req.body.accessToken = access_token;
        return next();
      }
    }

    const { user_email, user_password, user_id_login, user_id_encode, type_account } =
      req.body;
    console.log({ user_email, user_password, user_id_login, user_id_encode, type_account });

    //login với email và password
    if (user_email && user_password) {
      console.log("Vào 1");
      
      const infoUser = await Users.login(user_email, user_password,type_account);
      if (!infoUser?.user_id) {
        throw new Error("Email hoặc mật khẩu không hợp lệ");
      }
      await handleTokenGeneration(req, res, next, infoUser);

    } else if (user_id_login) {
      console.log("Vào 2");
      // Đăng nhập bằng social network
      const infoUser = await Users.loginWithUserID(
        user_id_login,
        user_password,
        type_account
      );
      console.log("Info user: ", infoUser);
      
      if (!infoUser?.user_id) {
        throw new Error("Thông tin người dùng không hợp lệ");
      }
      await handleTokenGeneration(req, res, next, infoUser);
    } else if (user_id_encode) {
      //login bằng khuôn mặt
      const user_id = decryptAESSame(user_id_encode);

      const infoUser = await Users.getById(user_id);

      if (infoUser) {
        await handleTokenGeneration(req, res, next, infoUser);
      }
    }
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
}

async function handleTokenGeneration(req, res, next, infoUser) {
  const randomKeyRefreshToken = generateRandomString();
  const key_encode = encryptAES(randomKeyRefreshToken);
  const new_access_token = new Token(infoUser).generateAccessToken();
  const new_refresh_token = new Token(infoUser).generateRefreshToken(
    randomKeyRefreshToken
  );
  
  await new Token(infoUser).create(new_refresh_token, randomKeyRefreshToken);

  const refreshTokenMaxAge =
    parseInt(process.env.TIME_EXPIRED_REFRESH_TOKEN) * 24 * 60 * 60 * 1000;
  const accessTokenMaxAge =
    parseInt(process.env.TIME_EXPIRED_ACCESS_TOKEN) * 60 * 1000;

  res.cookie("key_refresh_token_encode", key_encode, {
    maxAge: refreshTokenMaxAge,
    httpOnly: false,
    secure: true,
    sameSite: "None",
  });
  res.cookie("accessToken", new_access_token, {
    maxAge: accessTokenMaxAge,
    httpOnly: false,
    secure: true,
    sameSite: "None",
  });
  res.cookie("refreshToken", new_refresh_token, {
    maxAge: refreshTokenMaxAge,
    httpOnly: false,
    secure: true,
    sameSite: "None",
  });

  req.body.accessToken = new_access_token;
  return res.status(200).json({ status: true, message: "Đăng nhập thành công nhé" });
}
