// run once with: npm run create-admin
// admin is made here because password must be hashed before saving
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const createAdmin = async () => {
    let fullName = (await ask("Admin full name: ")).trim();
    let email = (await ask("Admin email: ")).trim().toLowerCase();
    let phone = (await ask("Admin phone (10 digits): ")).trim();
    let password = await ask("Admin password (min 8 characters, letter and number): ");
    rl.close();

    if (!fullName || !email || !/^\d{10}$/.test(phone) || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        console.log("Invalid details, admin was not created");
        process.exit(1);
    }

    try {
        let [roleRows] = await db.query("SELECT role_id FROM roles WHERE role_name = 'ADMIN'");
        let passwordHash = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (role_id, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)",
            [roleRows[0].role_id, fullName, email, phone, passwordHash]
        );
        console.log("Admin created successfully");
    } catch (error) {
        console.log("Could not create admin:", error.message);
    }
    process.exit();
};

createAdmin();
