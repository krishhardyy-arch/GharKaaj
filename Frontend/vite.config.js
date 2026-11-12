import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// all /api requests are sent to the backend, so we do not need to write the full url in fetch
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3000"
        }
    }
});
