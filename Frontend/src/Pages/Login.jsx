import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar.jsx";
import { saveLogin, getToken, getUser, getDashboardPath } from "../JS/auth.js";
import "../CSS/authForm.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    // if user is already logged in, no need to show login page again
    if (getToken() && getUser()) {
        return <Navigate to={getDashboardPath(getUser().role)} />;
    }

    let loginUser = async (event) => {
        event.preventDefault();

        if (email.trim() === "" || password === "") {
            alert("Please enter email and password");
            return;
        }

        try {
            let response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password: password })
            });
            let result = await response.json();

            if (!response.ok) {
                alert(result.message);
                return;
            }

            saveLogin(result.token, result.user);
            navigate(getDashboardPath(result.user.role));
        } catch (error) {
            alert("Could not connect to the server. Please try again");
        }
    };

    return (
        <>
            <Navbar />
            <main>
                <section className="form-section">
                    <div className="form-box">
                        <h1 className="form-title">Login</h1>
                        <form onSubmit={loginUser}>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input type="email" placeholder="Enter your email address" id="email" name="email"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input type="password" placeholder="Enter your password" id="password" name="password"
                                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div className="submit-button">
                                <button type="submit" className="primary-button">Login</button>
                            </div>
                        </form>
                        <p className="form-bottom-text">New to GharKaaj? <Link to="/register">Create an account</Link></p>
                    </div>
                </section>
            </main>
        </>
    );
};

export default Login;
