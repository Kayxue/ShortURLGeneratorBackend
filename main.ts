import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { expandGlob } from "jsr:@std/fs";
import IRouterExport from "./Interfaces/Interface.ts";
import { CookieStore, Session, sessionMiddleware } from "npm:hono-sessions";
import { ISession } from "./Types/Type.ts";
import { sessionKey } from "./Config.ts";

const hono = new Hono<{
	Variables: { session: Session<ISession>; session_key_rotation: boolean };
}>();

const store = new CookieStore();

hono.use(
	"*",
	sessionMiddleware({
		store,
		encryptionKey: sessionKey,
		expireAfterSeconds: 60 * 60 * 24,
	}),
);

hono.use(cors());

hono.get("/", (c) => {
	return c.text("Welcome to the ShortURL Backend");
});

for await (const file of expandGlob(`${Deno.cwd()}/Router/**/*.ts`)) {
	const { route, router }: IRouterExport = (
		await import(`file://${file.path}`)
	).default;
	hono.route(route, router);
}

Deno.serve({ port: 3000 }, hono.fetch);
