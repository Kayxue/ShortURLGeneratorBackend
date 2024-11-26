import { Hono } from "npm:hono";
import IRouterExport from "../Interfaces/Interface.ts";
import { LoginMiddleware } from "../Middleware/Middlewares.ts";

const hono = new Hono();

hono.post("insert", async (c) => {
	//TODO: Add user
});

hono.post("login", async (c) => {
	//TODO: Handle user login
});

hono.patch("update", LoginMiddleware, async (c) => {
	//TODO: Update user information
});

hono.patch("updatePassword", LoginMiddleware, async (c) => {
	//TODO: Update user password
});

hono.delete("delete", LoginMiddleware, async (c) => {
	//TODO: Delete user and logout
});

export default { route: "/user", router: hono } as IRouterExport;
