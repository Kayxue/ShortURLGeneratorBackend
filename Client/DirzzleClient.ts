import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../Schema/DatabaseSchema.ts";

const dbClient = drizzle(Deno.env.get("DB_URL"), { schema: { ...schema } });

export default dbClient;
