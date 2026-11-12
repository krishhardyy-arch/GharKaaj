import Navbar from "../Components/Navbar.jsx";
import Footer from "../Components/Footer.jsx";
import { Link } from "react-router-dom";
import "../CSS/index.css";

const Index = () => {
    return (
        <>
            <Navbar />
            <main>
                <section className="hero">
                    <h1>Need a technician at home? Get one in a few clicks.</h1>
                    <p>Tell us your problem, get a quotation from a verified local provider, and pay only after the service is done.</p>
                    <div className="hero-buttons">
                        <Link to="/register" className="green-button">Get started</Link>
                        <Link to="/login" className="light-button">Login</Link>
                    </div>
                </section>
                <section className="how-it-works">
                    <h2>How GharKaaj works</h2>
                    <div className="steps">
                        <div className="step">
                            <i className="fa-solid fa-pen-to-square"></i>
                            <h3>1. Create a request</h3>
                            <p>Describe your problem, location and preferred time.</p>
                        </div>
                        <div className="step">
                            <i className="fa-solid fa-user-check"></i>
                            <h3>2. Get a quotation</h3>
                            <p>A suitable verified provider accepts and sends a price.</p>
                        </div>
                        <div className="step">
                            <i className="fa-solid fa-screwdriver-wrench"></i>
                            <h3>3. Service at your door</h3>
                            <p>The provider arrives, you confirm, and the work is done.</p>
                        </div>
                        <div className="step">
                            <i className="fa-solid fa-credit-card"></i>
                            <h3>4. Pay and review</h3>
                            <p>Pay online after the service and rate your provider.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Index;
