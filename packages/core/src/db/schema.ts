// Drizzle ORM schema for the database tables.
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Defines the 'mobiles' table for storing user mobile numbers.
// Users can extend this schema by adding more columns to this table
// or creating new tables and linking them using foreign keys.
export const mobiles = sqliteTable("mobiles", {
	id: text("id")
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	mobileNumber: text("mobile_number").notNull().unique(), // E.g., "+919876543210"
	createdAt: text("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

// Defines the 'otps' table for storing OTP codes.
export const otps = sqliteTable("otps", {
	id: text("id")
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	mobileId: text("mobile_id")
		.notNull()
		.references(() => mobiles.id, { onDelete: "cascade" }),
	code: text("code").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(), // Unix timestamp
	createdAt: text("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	verifiedAt: text("verified_at"), // Timestamp when OTP was successfully verified
});
