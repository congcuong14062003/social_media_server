import { Router } from "express";
import express from 'express';
import GroupChannelRouter from "./group_channel.router";
import GroupMemberRouter from "./group_member.router";
 const GroupsRouter = (router = Router()) => {
  router.use("/channel", GroupChannelRouter(express.Router()));
  router.use("/members", GroupMemberRouter(express.Router()));
  return router;
};
export default GroupsRouter;