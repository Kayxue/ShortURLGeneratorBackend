import { Hono } from "npm:hono";
import IRouterExport from "../Interfaces/Interface.ts";
import { LoginMiddleware } from "../Middleware/Middlewares.ts";
import { zValidator } from "npm:@hono/zod-validator";
import {
	userCreateSchema,
	userLoginSchema,
	userUpdatePasswordSchema,
	userUpdateSchema,
} from "../Schema/ZodSchema.ts";
import { hash, Variant, Version } from "jsr:@felix/argon2";

const hono = new Hono();

hono.post("insert", zValidator("json", userCreateSchema), async (c) => {
	const { username, password, name } = await c.req.json();
	const objectToInsert = {
		username,
		password: await hash(password, {
			variant: Variant.Argon2id,
			version: Version.V13,
			timeCost: 8,
			lanes: 8,
		}),
		name,
	};
	//TODO: Add user to database
	return c.text("User insert route");
});

hono.post("login", zValidator("json", userLoginSchema), async (c) => {
	//TODO: Handle user login
	return c.text("User Login");
});

hono.patch(
	"update",
	LoginMiddleware,
	zValidator("json", userUpdateSchema),
	async (c) => {
		//TODO: Update user information
		return c.text("User update route");
	},
);

hono.patch(
	"updatePassword",
	LoginMiddleware,
	zValidator("json", userUpdatePasswordSchema),
	async (c) => {
		//TODO: Update user password
		return c.text("Update user password route");
	},
);

export default { route: "/user", router: hono } as IRouterExport;
