const jwt = require('jsonwebtoken');
require("dotenv").config()

export async function Authorization(req, res, next) {
    try {
        const access_token = req.body.accessToken;
        if (!access_token) {
            return res.status(401).json({ status: false, message: 'Không thể xác thực' });
        }
        const dataUser = jwt.decode(access_token);
        req.body = { ...req.body, status: 'validated', data: dataUser };
        next();

    } catch (error) {
        res.status(403).json({ status: false, message: "Error" });
    }
}


export function Role(req, res, next, ...requiredRoles) {
    try {
        const { status, data } = req.body;
        if (status !== 'validated') {
            throw new Error("Lỗi truy cập");
        }
        const userRole = data.role.toLowerCase();
        let requiredRoles = ["admin","friend","mine"]
        if (requiredRoles.includes(userRole)) {
            next();
        } else {
            throw new Error("Không có quyền truy cập");
        }

    } catch (error) {
        res.status(403).json({ status: false, message: error.message });
    }
}