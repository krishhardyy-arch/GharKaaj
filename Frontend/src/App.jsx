import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./Pages/Index.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";
import CustomerDashboard from "./Pages/CustomerDashboard.jsx";
import ProviderDashboard from "./Pages/ProviderDashboard.jsx";
import AdminDashboard from "./Pages/AdminDashboard.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* dashboards can open only with the correct role */}
            <Route path="/customer-dashboard" element={
                <ProtectedRoute role="CUSTOMER"><CustomerDashboard /></ProtectedRoute>
            } />
            <Route path="/provider-dashboard" element={
                <ProtectedRoute role="PROVIDER"><ProviderDashboard /></ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
                <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default App;
