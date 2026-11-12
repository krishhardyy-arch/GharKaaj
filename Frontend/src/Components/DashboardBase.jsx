import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, getUser, saveLogin, clearLogin, getDashboardPath } from "../JS/auth.js";
import logo from "../Assets/images/gharkaaj-logo.png";
import "../CSS/dashboard.css";

// menu of each role, only the Dashboard page is ready for now
const navLinks = {
    CUSTOMER: ["Dashboard", "My Requests", "History"],
    PROVIDER: ["Dashboard", "New Requests", "My Jobs", "Availability"]
};
const adminLinks = ["Dashboard", "Providers", "Users", "Categories", "Requests", "Bookings", "Payments", "Reviews"];
const icons = {
    Dashboard: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    Providers: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    Users: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 9a3 3 0 010 6",
    Categories: "M4 6h16M4 12h16M4 18h16",
    Requests: "M6 3h9l4 4v14H6zM9 12h7M9 16h7",
    Bookings: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4",
    Payments: "M3 6h18v12H3zM3 10h18",
    Reviews: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
    Logout: "M9 4H4v16h5M16 8l4 4-4 4M20 12H9"
};

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

    // name shown in the profile menu, saved name is used until the profile is loaded
    let savedUser = getUser();
    let firstName = "Profile";
    if (profile) {
        firstName = profile.fullName.split(" ")[0];
    } else if (savedUser && savedUser.fullName) {
        firstName = savedUser.fullName.split(" ")[0];
    }

    let content = (
        <>
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
        </>
    );

    // admin has a sidebar instead of the top nav bar
    if (role === "ADMIN") {
        return (
            <div className="admin-layout">
                <aside className="sidebar">
                    <img src={logo} alt="GharKaaj" />
                    {adminLinks.map((item) => (
                        <div key={item} className={item === "Dashboard" ? "sidebar-item active" : "sidebar-item soon"}
                            title={item === "Dashboard" ? "" : "Coming soon"}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons[item]} /></svg>
                            {item}
                        </div>
                    ))}
                    <button className="sidebar-item sidebar-logout" onClick={logout}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons.Logout} /></svg>
                        Logout
                    </button>
                </aside>
                <main className="admin-content">{content}</main>
            </div>
        );
    }

    return (
        <>
            <header>
                <nav>
                    <div className="nav-bar">
                        <div className="brand">
                            <Link to={getDashboardPath(role)}><img src={logo} alt="GharKaaj" /></Link>
                        </div>
                        <ul className="nav-pages-links">
                            {navLinks[role].map((item) => (
                                item === "Dashboard"
                                    ? <li key={item}><Link to={getDashboardPath(role)} className="active">{item}</Link></li>
                                    : <li key={item}><span className="soon" title="Coming soon">{item}</span></li>
                            ))}
                        </ul>
                        <div className="nav-right">
                            <button className="bell-button" title="Notifications (coming soon)" aria-label="Notifications">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#102F35" strokeWidth="2">
                                    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
                                </svg>
                            </button>
                            <details className="profile-menu">
                                <summary>{firstName}</summary>
                                <div className="menu">
                                    <div>My profile</div>
                                    <button onClick={logout}>Logout</button>
                                </div>
                            </details>
                        </div>
                    </div>
                </nav>
            </header>
            <main className="dashboard-main">{content}</main>
        </>
    );
};

export default DashboardBase;
