import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { expandGlob } from "jsr:@std/fs";
import IRouterExport from "./Interfaces/Interface.ts";
import { CookieStore, Session, sessionMiddleware } from "npm:hono-sessions";
import { ISession } from "./Types/Type.ts";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { apiReference } from "npm:@scalar/hono-api-reference";

const hono = new Hono<{
	Variables: { session: Session<ISession>; session_key_rotation: boolean };
}>();

const store = new CookieStore();

hono.use(
	"*",
	sessionMiddleware({
		store,
		encryptionKey: Deno.env.get("sessionKey"),
		expireAfterSeconds: 60 * 60 * 24,
	}),
);

hono.use(cors());

hono.get(
	"/",
	describeRoute({
		description:
			"Home route, just use to test out that whether the server is online",
		responses: {
			200: {
				description: "Successful Response",
				content: {
					"text/plain": {
						example:"Welcome to the ShortURL Backend"
					},
				},
			},
		},
	}),
	(c) => {
		return c.text("Welcome to the ShortURL Backend");
	},
);

for await (const file of expandGlob(`${Deno.cwd()}/Router/**/*.ts`)) {
	const { route, router }: IRouterExport = (
		await import(`file://${file.path}`)
	).default;
	hono.route(route, router);
}

hono.get(
	"headers",
	describeRoute({
		description: "Check header of request",
		responses: { 200: { description: "Successful response" } },
	}),
	(c) => {
		return c.json({ headers: c.req.header() });
	},
);

hono.get(
	"openapi",
	openAPISpecs(hono, {
		documentation: { info: { title: "Documentation", version: "1.0.0" } },
	}),
);

hono.get("docs", apiReference({ theme: "saturn", spec: { url: "/openapi" } }));
Deno.serve({ port: 3000 }, hono.fetch);
