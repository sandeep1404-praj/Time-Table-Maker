/**
 * Environment variable loader.
 * 
 * This module is imported as the very first side-effect import in server.js.
 * Because ES module imports are evaluated in dependency order, importing this
 * module before all others guarantees that dotenv.config() runs before any
 * module reads process.env.
 * 
 * Note: In true ESM the import order between sibling imports is not guaranteed.
 * The reliable solution for production is to pass env vars via the process
 * environment directly (e.g., Render / Heroku env vars, Docker --env-file).
 * This file is a convenience loader for local development.
 */
import dotenv from "dotenv";

dotenv.config();
