import { createToken, decodeRefreshToken, deleteToken } from "../../controllers/Token/token.controller";
import Authentication from "../../middleware/authentication.js";
import express from "express";
const router = express.Router();
const TokenRouter = () => {
    router.delete('/delete', Authentication, deleteToken);
    router.post('/create', createToken);
    router.post('/decode-refresh-token', decodeRefreshToken);
    return router;
}
export default TokenRouter;