import type { Config } from "drizzle-kit";

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: { url: "./otp-auth.sql" },
	verbose: true,
	strict: true,
} satisfies Config;
