import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar.jsx";
import "../CSS/authForm.css";

const Register = () => {
    const [formData, setFormData] = useState({
        role: "CUSTOMER",
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        experienceYears: "",
        idDocumentNumber: ""
    });
    const navigate = useNavigate();

    // one function for all the input boxes, it uses the name of the input
    let handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    // validating the form, returns true only when everything is correct
    let registerValidation = (data) => {
        if (data.fullName === "" || data.email === "" || data.phone === "" || data.password === "") {
            alert("Please fill all the fields in the form");
            return false;
        }
        else if (data.email.indexOf("@") === -1 || data.email.indexOf(".") === -1) {
            alert("Please enter a valid email address");
            return false;
        }
        else if (isNaN(data.phone) || data.phone.length !== 10) {
            alert("Phone number must be exactly 10 digits");
            return false;
        }
        else if (data.password.length < 8) {
            alert("Password must be at least 8 characters");
            return false;
        }
        else if (!/[A-Za-z]/.test(data.password) || !/[0-9]/.test(data.password)) {
            alert("Password must contain at least one letter and one number");
            return false;
        }
        else if (data.password !== data.confirmPassword) {
            alert("Password and confirm password are not same");
            return false;
        }
        return true;
    };

    let registerUser = async (event) => {
        event.preventDefault();

        let data = {
            ...formData,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            idDocumentNumber: formData.idDocumentNumber.trim()
        };

        if (!registerValidation(data)) {
            return;
        }

        try {
            let response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            let result = await response.json();

            alert(result.message);
            if (response.ok) {
                navigate("/login");
            }
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
                        <h1 className="form-title">Create an account</h1>
                        <form onSubmit={registerUser}>
                            <div className="form-group">
                                <label>I want to register as:</label>
                                <div className="role-choice">
                                    <div>
                                        <input type="radio" id="role-customer" name="role" value="CUSTOMER"
                                            checked={formData.role === "CUSTOMER"} onChange={handleChange} />
                                        <label htmlFor="role-customer">Customer</label>
                                    </div>
                                    <div>
                                        <input type="radio" id="role-provider" name="role" value="PROVIDER"
                                            checked={formData.role === "PROVIDER"} onChange={handleChange} />
                                        <label htmlFor="role-provider">Service provider</label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Full name:</label>
                                <input type="text" placeholder="Enter your full name" id="name" name="fullName"
                                    value={formData.fullName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input type="email" placeholder="Enter your email address" id="email" name="email"
                                    value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pho">Phone number:</label>
                                <input type="tel" placeholder="10 digit phone number" id="pho" name="phone"
                                    value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input type="password" placeholder="At least 8 characters, letter and number" id="password"
                                    name="password" value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password">Confirm password:</label>
                                <input type="password" placeholder="Enter the password again" id="confirm-password"
                                    name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>

                            {/* extra fields only for service provider */}
                            {formData.role === "PROVIDER" && (
                                <div className="provider-fields">
                                    <div className="form-group">
                                        <label htmlFor="experience">Years of experience:</label>
                                        <input type="number" placeholder="Example: 3" id="experience" name="experienceYears"
                                            min="0" max="60" value={formData.experienceYears} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="id-number">Citizenship / ID number (for verification):</label>
                                        <input type="text" placeholder="Enter your ID number" id="id-number" name="idDocumentNumber"
                                            value={formData.idDocumentNumber} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            <div className="submit-button">
                                <button type="submit" className="green-button">Register</button>
                            </div>
                        </form>
                        <p className="form-bottom-text">Already have an account? <Link to="/login">Login</Link></p>
                    </div>
                </section>
            </main>
        </>
    );
};

export default Register;
