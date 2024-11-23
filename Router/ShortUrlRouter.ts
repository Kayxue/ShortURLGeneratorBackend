import { Hono } from "jsr:@hono/hono";
import { nanoid } from "npm:nanoid";
import { zValidator } from "npm:@hono/zod-validator";
import IRouterExport from "../Interfaces/Interface.ts";
import { createUrlSchema } from "../Schema/Schema.ts";

const hono = new Hono();

hono.post("/create", zValidator("json", createUrlSchema), async (c) => {
	const { userId, param, url, password } = await c.req.json();
	//TODO: generate data and push into database
	return c.json({ userId, param, url, password });
});

hono.patch("/:param",/* Login Middleware, Url Owned Middleware, zodValidator, */c => {
	//TODO: Check the short url information exist, if exist, update the information.
	return c.text("Update Path")
})

hono.get("/:param",c => {
	//TODO: Get url to redirect to from database and check whether the short url need password to redirect
	return c.text("url redirect")
})

hono.post("/:param/password",c => {
	//TODO: Check password for the short url which need password verification.
	return c.text("url password verification")
})

export default { route: "/shorturl", router: hono } as IRouterExport;
