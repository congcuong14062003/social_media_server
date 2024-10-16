import { createOTPEmail, createOTPEmailExisted, createOTPEmailLink, verifyOTPEmail } from "../../controllers/Email/email_otp.controller";

 const EmailOTPRouter = (router) => {
    router.post('/create', createOTPEmailExisted);
    router.post('/link/create', createOTPEmailLink);
    router.post('/signup/create', createOTPEmail);
    router.post('/verify', verifyOTPEmail);
    return router;
}
export default EmailOTPRouter;