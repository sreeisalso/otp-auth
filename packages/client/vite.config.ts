import { defineConfig } from "vite";
import baseConfig from "../../vite.config";

export default defineConfig({
	...baseConfig,
	build: {
		...baseConfig.build,
		lib: {
			entry: "src/index.ts",
			formats: ["es"],
			fileName: "index",
		},
	},
});
