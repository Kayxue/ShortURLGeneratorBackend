import { Hono } from "jsr:@hono/hono";
import { nanoid } from "npm:nanoid";
import { zValidator } from "npm:@hono/zod-validator";
import IRouterExport from "../Interfaces/Interface.ts";

const hono = new Hono();

hono.post("/create", async (c) => {
	return c.text("created route");
});

export default { route: "/shorturl", router: hono } as IRouterExport;
