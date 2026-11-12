import DashboardBase from "../Components/DashboardBase.jsx";

const AdminDashboard = () => {
    return (
        <DashboardBase
            role="ADMIN"
            heading="This is the admin dashboard."
            comingNext={[
                "Verify service providers",
                "Manage services and categories",
                "Monitor requests, bookings and payments"
            ]}
        />
    );
};

export default AdminDashboard;
