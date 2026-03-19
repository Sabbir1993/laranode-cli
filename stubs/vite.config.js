import { defineConfig } from 'vite';

// --- INERTIA FRONTEND CONFIGURATION ---
// Uncomment the plugin for the frontend framework you wish to use.

// 1. For React:
import react from '@vitejs/plugin-react';

// 2. For Vue:
// import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        // -> For React:
        react(),

        // -> For Vue:
        // vue({
        //     template: {
        //         transformAssetUrls: {
        //             base: null,
        //             includeAbsolute: false,
        //         },
        //     },
        // }),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
    },
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        rollupOptions: {
            // Your entry point based on framework choice
            input: 'resources/js/app.jsx', // Change to 'resources/js/app.js' if using Vue
        },
    },
});
