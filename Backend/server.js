require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

// server should not start without secret key
if (!process.env.JWT_SECRET) {
    console.log("JWT_SECRET is missing. Please create .env file from .env.example");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("GharKaaj backend is running");
});

app.use("/api/auth", authRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// handles errors like broken json from the client
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid data sent to the server" });
    }
    console.log(err);
    res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
    console.log(`GharKaaj server is running on http://localhost:${PORT}`);
});
