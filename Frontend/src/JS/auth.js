// small helper functions that are used by login, register and dashboard pages

// saving token and user details in local storage after login
export const saveLogin = (token, user) => {
    localStorage.setItem("gharkaajToken", token);
    localStorage.setItem("gharkaajUser", JSON.stringify(user));
};

export const getToken = () => {
    return localStorage.getItem("gharkaajToken");
};

export const getUser = () => {
    return JSON.parse(localStorage.getItem("gharkaajUser"));
};

export const clearLogin = () => {
    localStorage.removeItem("gharkaajToken");
    localStorage.removeItem("gharkaajUser");
};

// path of the dashboard for each role
export const getDashboardPath = (role) => {
    if (role === "CUSTOMER") {
        return "/customer-dashboard";
    } else if (role === "PROVIDER") {
        return "/provider-dashboard";
    } else if (role === "ADMIN") {
        return "/admin-dashboard";
    }
    return "/login";
};
