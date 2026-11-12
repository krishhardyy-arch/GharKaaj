const jwt = require("jsonwebtoken");
const db = require("../config/db");

// checks that the request has a valid token and the user is still active
const verifyToken = async (req, res, next) => {
    let header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Please login first" });
    }

    let token = header.split(" ")[1];

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECRET);

        // token can still be valid after admin suspends the user, so checking database again
        let [rows] = await db.query("SELECT status FROM users WHERE user_id = ?", [decoded.userId]);
        if (rows.length === 0 || rows[0].status !== "ACTIVE") {
            return res.status(403).json({ message: "Your account is not active" });
        }

        req.user = { userId: decoded.userId, role: decoded.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Login expired or token is invalid" });
    }
};

// use after verifyToken, example: allowRoles("ADMIN")
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not allowed to use this function" });
        }
        next();
    };
};

module.exports = { verifyToken, allowRoles };
