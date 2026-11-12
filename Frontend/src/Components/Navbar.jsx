import { Link } from "react-router-dom";
import logo from "../Assets/images/gharkaaj-logo.png";

// nav bar used on home, login and register page
const Navbar = () => {
    return (
        <header>
            <nav>
                <div className="nav-bar">
                    <div className="brand">
                        <Link to="/"><img src={logo} alt="GharKaaj" /></Link>
                    </div>
                    <ul className="nav-pages-links public-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/register" className="register-link">Register</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
