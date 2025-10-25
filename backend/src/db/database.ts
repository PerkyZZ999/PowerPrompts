/**
 * Database management using sql.js (pure JavaScript SQLite)
 */

import initSqlJs, { Database } from "sql.js";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { appConfig } from "../config.js";

let dbInstance: Database | null = null;

/**
 * Initialize the SQLite database
 */
export async function initDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Initialize sql.js
    const SQL = await initSqlJs();

    // Ensure data directory exists
    const dbDir = dirname(appConfig.databasePath);
    if (!existsSync(dbDir)) {
      await mkdir(dbDir, { recursive: true });
    }

    // Load existing database or create new one
    let db: Database;
    if (existsSync(appConfig.databasePath)) {
      const buffer = await readFile(appConfig.databasePath);
      db = new SQL.Database(buffer);
      console.log(
        `[DATABASE] Loaded existing database from: ${appConfig.databasePath}`,
      );
    } else {
      db = new SQL.Database();
      console.log("[DATABASE] Created new database");
    }

    // Read and execute schema
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const schemaPath = join(__dirname, "schema.sql");
    const schema = await readFile(schemaPath, "utf-8");

    // Execute schema (create tables if they don't exist)
    db.exec(schema);
    console.log("[DATABASE] Schema initialized successfully");

    // Save database to disk
    await saveDatabase(db);

    dbInstance = db;
    return db;
  } catch (error) {
    console.error("[DATABASE ERROR] Failed to initialize database:", error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    return await initDatabase();
  }
  return dbInstance;
}

/**
 * Save the database to disk
 */
export async function saveDatabase(db?: Database): Promise<void> {
  const database = db || dbInstance;
  if (!database) {
    throw new Error("No database instance to save");
  }

  try {
    const data = database.export();
    const buffer = Buffer.from(data);
    await writeFile(appConfig.databasePath, buffer);
  } catch (error) {
    console.error("[DATABASE ERROR] Failed to save database:", error);
    throw error;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await saveDatabase();
    dbInstance.close();
    dbInstance = null;
    console.log("[DATABASE] Database closed");
  }
}

/**
 * Execute a query and return results
 */
export async function query<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  const db = await getDatabase();

  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as T;
      results.push(row);
    }

    stmt.free();
    return results;
  } catch (error) {
    console.error("[DATABASE ERROR] Query failed:", error);
    console.error("SQL:", sql);
    console.error("Params:", params);
    throw error;
  }
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await getDatabase();

  try {
    db.run(sql, params);
    await saveDatabase(db);
  } catch (error) {
    console.error("[DATABASE ERROR] Execute failed:", error);
    console.error("SQL:", sql);
    console.error("Params:", params);
    throw error;
  }
}

/**
 * Execute multiple statements in a transaction
 */
export async function transaction(
  callback: (db: Database) => Promise<void>,
): Promise<void> {
  const db = await getDatabase();

  try {
    db.run("BEGIN TRANSACTION");
    await callback(db);
    db.run("COMMIT");
    await saveDatabase(db);
  } catch (error) {
    db.run("ROLLBACK");
    console.error("[DATABASE ERROR] Transaction failed:", error);
    throw error;
  }
}
