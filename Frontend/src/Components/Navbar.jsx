import { Link } from "react-router-dom";

// nav bar used on home, login and register page
const Navbar = () => {
    return (
        <header>
            <nav>
                <div className="nav-bar">
                    <div className="brand">
                        <Link to="/">Ghar<span>Kaaj</span></Link>
                    </div>
                    <ul className="nav-pages-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/register">Register</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
