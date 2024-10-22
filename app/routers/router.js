import TokenRouter from "./Token/token.router.js";
import FriendRouter from "./Friend/friend.router.js";
import UserRouter from "./User/user.router.js";
import MessageRouter from "./Message/message.router.js";
import express from 'express';
import PostRouter from "./Post/post.router.js";
import EmailOTPRouter from "./Email/email_otp.router.js";
import StoryRouter from "./Story/story.router.js";

export default function RouterMain(app) {
  app.use("/users", UserRouter(express.Router()));
  app.use("/posts", PostRouter(express.Router()));
  app.use("/stories", StoryRouter(express.Router()));
  app.use("/friends", FriendRouter(express.Router()));
  app.use("/messages", MessageRouter(express.Router()));
  app.use("/token", TokenRouter(express.Router()));
  app.use('/otp', EmailOTPRouter(express.Router()));
  return app;
}
