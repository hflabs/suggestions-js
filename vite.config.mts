/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@provider": path.resolve(__dirname, "src/lib/Provider"),
            "@provider_strategy": path.resolve(__dirname, "src/lib/Provider/includes/strategy"),
            "@provider_api": path.resolve(__dirname, "src/lib/Provider/includes/api"),
            "@provider_suggestions": path.resolve(
                __dirname,
                "src/lib/Provider/includes/suggestions"
            ),
            "@view": path.resolve(__dirname, "src/lib/View"),
            "@tests": path.resolve(__dirname, "tests"),
        },
    },
    build: {
        lib: {
            entry: [path.resolve(__dirname, "src/index.ts")],
            name: "Dadata",
            formats: ["cjs", "es", "iife"],
            fileName: (format) =>
                format === "iife"
                    ? "suggestions.min.js"
                    : `index.${format === "es" ? "js" : "cjs"}`,
        },
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) =>
                    assetInfo.name === "style.css" ? "suggestions.min.css" : "[name].[ext]",
            },
        },
        emptyOutDir: true,
    },
    plugins: [
        dts({
            rollupTypes: true,
            copyDtsFiles: true,
            beforeWriteFile: (filePath, content) => {
                if (!filePath.endsWith("/dist/index.d.ts")) {
                    return {
                        filePath,
                        content,
                    };
                }

                // в собранном файле типов добавить экспорты для второстепенных типов,
                // которые не экспортируются по-умолчанию
                return {
                    filePath,
                    content: content
                        .split("\n")
                        .map((line) => line.replace(/^declare/, "export declare"))
                        .join("\n"),
                };
            },
        }),
    ],
    test: {
        setupFiles: path.resolve(`${__dirname}/tests/vitest.setup.ts`),
        chaiConfig: { truncateThreshold: 0 },
    },
});
