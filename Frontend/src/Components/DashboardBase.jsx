import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, saveLogin, clearLogin, getDashboardPath } from "../JS/auth.js";
import "../CSS/dashboard.css";

// this is used by customer, provider and admin dashboard
// each dashboard sends its own role, heading and list of coming features
const DashboardBase = ({ role, heading, comingNext }) => {
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    let logout = () => {
        clearLogin();
        navigate("/login");
    };

    useEffect(() => {
        let loadProfile = async () => {
            try {
                let response = await fetch("/api/auth/me", {
                    headers: { "Authorization": "Bearer " + getToken() }
                });

                // token expired, fake or user suspended
                if (response.status === 401 || response.status === 403) {
                    alert("Your login is not valid anymore. Please login again");
                    clearLogin();
                    navigate("/login");
                    return;
                }

                let data = await response.json();

                // role in database must match this page
                // saved role in local storage is corrected first, otherwise pages keep sending the user back and forth
                if (data.role !== role) {
                    saveLogin(getToken(), { id: data.id, fullName: data.fullName, email: data.email, role: data.role });
                    navigate(getDashboardPath(data.role));
                    return;
                }
                setProfile(data);
            } catch (error) {
                alert("Could not connect to the server. Please try again");
            }
        };

        loadProfile();
    }, []);

    // provider can see if admin has approved him/her or not
    let getVerificationBox = () => {
        if (profile.verificationStatus === "PENDING") {
            return (
                <section className="status-box status-pending" id="verification-box">
                    <p>Your account is waiting for admin approval. You will receive service requests after approval.</p>
                </section>
            );
        } else if (profile.verificationStatus === "APPROVED") {
            return (
                <section className="status-box status-approved" id="verification-box">
                    <p>Your account is verified. You can receive service requests.</p>
                </section>
            );
        }
        return (
            <section className="status-box status-rejected" id="verification-box">
                <p>Your account was rejected. Reason: {profile.rejectionReason || "not given"}</p>
            </section>
        );
    };

    return (
        <>
            <header>
                <nav>
                    <div className="nav-bar">
                        <div className="brand">
                            <Link to={getDashboardPath(role)}>Ghar<span>Kaaj</span></Link>
                        </div>
                        <ul className="nav-pages-links">
                            <li><button className="green-button" onClick={logout}>Logout</button></li>
                        </ul>
                    </div>
                </nav>
            </header>
            <main className="dashboard-main">
                <section className="welcome-box">
                    <h1>Welcome, <span id="user-name">{profile ? profile.fullName : "..."}</span></h1>
                    <p>{heading}</p>
                    <span className="role-tag">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                </section>

                {profile && profile.role === "PROVIDER" && getVerificationBox()}

                <section className="info-section">
                    <div className="info-card">
                        <h2>Your details</h2>
                        <p><b>Email:</b> <span id="user-email">{profile ? profile.email : ""}</span></p>
                        <p><b>Phone:</b> <span id="user-phone">{profile ? profile.phone : ""}</span></p>
                    </div>
                    <div className="info-card">
                        <h2>Coming next</h2>
                        {comingNext.map((item) => (
                            <p key={item}>{item}</p>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
};

export default DashboardBase;
