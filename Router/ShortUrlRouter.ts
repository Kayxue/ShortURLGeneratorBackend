import { Hono } from "npm:hono";
import { nanoid } from "npm:nanoid";
import { zValidator } from "npm:@hono/zod-validator";
import { verify } from "jsr:@felix/argon2";
import IRouterExport from "../Interfaces/Interface.ts";
import {
	createUrlSchema,
	shortUrlPasswordVerificationSchema,
} from "../Schema/ZodSchema.ts";
import { LoginMiddleware } from "../Middleware/Middlewares.ts";

const hono = new Hono();

hono.post("/create", zValidator("json", createUrlSchema), async (c) => {
	const { userId, param, url, password } = await c.req.json();
	//TODO: generate data and push into database
	return c.json({ userId, param, url, password });
});

hono.get("/:param", (c) => {
	const { param } = c.req.param();
	//TODO: Get url to redirect to from database and check whether the short url need password to redirect
	return c.text("url redirect");
});

hono.patch(
	"/:param",
	LoginMiddleware,
	/* zodValidator, */ (c) => {
		//TODO: Check the short url information exist and owned by the user, if yes, update the information.
		return c.text("Update Path");
	},
);

hono.post(
	"/:param/password",
	zValidator("json", shortUrlPasswordVerificationSchema),
	(c) => {
		//TODO: Check password for the short url which need password verification.
		return c.text("url password verification");
	},
);

export default { route: "/shorturl", router: hono } as IRouterExport;
