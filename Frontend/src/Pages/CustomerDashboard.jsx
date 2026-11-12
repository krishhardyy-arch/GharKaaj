import DashboardBase from "../Components/DashboardBase.jsx";

const CustomerDashboard = () => {
    return (
        <DashboardBase
            role="CUSTOMER"
            heading="This is your customer dashboard."
            comingNext={[
                "Create service requests",
                "View quotations and bookings",
                "Payment and service history"
            ]}
        />
    );
};

export default CustomerDashboard;
