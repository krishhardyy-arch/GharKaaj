import DashboardBase from "../Components/DashboardBase.jsx";

const ProviderDashboard = () => {
    return (
        <DashboardBase
            role="PROVIDER"
            heading="This is your service provider dashboard."
            comingNext={[
                "Add your skills and service areas",
                "Receive and quote service requests",
                "Job history and ratings"
            ]}
        />
    );
};

export default ProviderDashboard;
