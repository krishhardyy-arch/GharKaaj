const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

let isText = (value) => typeof value === "string" && value.trim() !== "";
let isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// register a new customer or provider
const registerUser = async (req, res) => {
    let { fullName, email, phone, password, role, experienceYears, idDocumentNumber } = req.body;

    // admin can never be created from the website, only customer and provider
    if (role !== "CUSTOMER" && role !== "PROVIDER") {
        return res.status(400).json({ message: "Role must be CUSTOMER or PROVIDER" });
    }
    if (!isText(fullName) || !isText(email) || !isText(phone) || !isText(password)) {
        return res.status(400).json({ message: "Please fill all the required fields" });
    }

    fullName = fullName.trim();
    email = email.trim().toLowerCase();
    phone = phone.trim();

    if (fullName.length < 2 || fullName.length > 100) {
        return res.status(400).json({ message: "Name must be between 2 and 100 characters" });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters and contain a letter and a number" });
    }

    // extra details only for provider
    let experience = 0;
    let idNumber = null;
    if (role === "PROVIDER") {
        experience = Number(experienceYears) || 0;
        if (!Number.isInteger(experience) || experience < 0 || experience > 60) {
            return res.status(400).json({ message: "Experience must be a whole number between 0 and 60" });
        }
        if (isText(idDocumentNumber)) {
            idNumber = idDocumentNumber.trim().slice(0, 50);
        }
    }

    let connection = await db.getConnection();

    try {
        let [oldUser] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
        if (oldUser.length > 0) {
            return res.status(409).json({ message: "This email is already registered" });
        }

        let passwordHash = await bcrypt.hash(password, 10);
        let [roleRows] = await connection.query("SELECT role_id FROM roles WHERE role_name = ?", [role]);

        // user and profile should be saved together, so using transaction
        await connection.beginTransaction();

        let [userResult] = await connection.query(
            "INSERT INTO users (role_id, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)",
            [roleRows[0].role_id, fullName, email, phone, passwordHash]
        );

        if (role === "CUSTOMER") {
            await connection.query("INSERT INTO customer_profiles (user_id) VALUES (?)", [userResult.insertId]);
        } else {
            await connection.query(
                "INSERT INTO provider_profiles (user_id, experience_years, id_document_number) VALUES (?, ?, ?)",
                [userResult.insertId, experience, idNumber]
            );
        }

        await connection.commit();

        let message = "Registration successful. Please login.";
        if (role === "PROVIDER") {
            message = "Registration successful. Your account will be active for requests after admin approval.";
        }
        res.status(201).json({ message: message });
    } catch (error) {
        await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This email is already registered" });
        }
        console.log(error);
        res.status(500).json({ message: "Something went wrong on the server" });
    } finally {
        connection.release();
    }
};

// login with email and password, gives back a token
const loginUser = async (req, res) => {
    let { email, password } = req.body;

    if (!isText(email) || !isText(password)) {
        return res.status(400).json({ message: "Please enter email and password" });
    }

    try {
        let [rows] = await db.query(
            `SELECT u.user_id, u.full_name, u.email, u.password_hash, u.status, r.role_name
             FROM users u
             JOIN roles r ON r.role_id = u.role_id
             WHERE u.email = ?`,
            [email.trim().toLowerCase()]
        );

        // same message for wrong email and wrong password
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        let user = rows[0];
        let passwordMatched = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatched) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({ message: "Your account is suspended or deactivated" });
        }

        let token = jwt.sign(
            { userId: user.user_id, role: user.role_name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role_name
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong on the server" });
    }
};

// details of the logged in user, used by dashboards
const getMyProfile = async (req, res) => {
    try {
        let [rows] = await db.query(
            `SELECT u.user_id, u.full_name, u.email, u.phone, r.role_name
             FROM users u
             JOIN roles r ON r.role_id = u.role_id
             WHERE u.user_id = ?`,
            [req.user.userId]
        );
        let user = rows[0];
        let profile = {
            id: user.user_id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role_name
        };

        if (user.role_name === "PROVIDER") {
            let [providerRows] = await db.query(
                "SELECT provider_id, verification_status, rejection_reason FROM provider_profiles WHERE user_id = ?",
                [user.user_id]
            );
            profile.providerId = providerRows[0].provider_id;
            profile.verificationStatus = providerRows[0].verification_status;
            profile.rejectionReason = providerRows[0].rejection_reason;
        }

        res.json(profile);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong on the server" });
    }
};

module.exports = { registerUser, loginUser, getMyProfile };
