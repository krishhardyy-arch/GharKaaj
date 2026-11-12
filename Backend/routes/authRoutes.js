const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMyProfile } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", verifyToken, getMyProfile);

module.exports = router;
