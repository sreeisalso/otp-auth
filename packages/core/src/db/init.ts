// Database initialization and connection.
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Initializes the database connection using Drizzle ORM.
 * @param {string} dbUrl - The database connection URL (e.g., 'file:./sqlite.db').
 * @returns {DbClient} The Drizzle ORM database client.
 */
export function initDb(dbUrl: string): DbClient {
	const client = createClient({ url: dbUrl });
	return drizzle(client, { schema });
}
