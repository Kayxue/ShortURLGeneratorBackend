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

const hono = new Hono();

hono.post("insert", zValidator("json", userCreateSchema), async (c) => {
	//TODO: Add user
});

hono.post("login", zValidator("json", userLoginSchema), async (c) => {
	//TODO: Handle user login
});

hono.patch(
	"update",
	LoginMiddleware,
	zValidator("json", userUpdateSchema),
	async (c) => {
		//TODO: Update user information
	},
);

hono.patch(
	"updatePassword",
	LoginMiddleware,
	zValidator("json", userUpdatePasswordSchema),
	async (c) => {
		//TODO: Update user password
	},
);

hono.delete("delete/:id", LoginMiddleware, async (c) => {
	//TODO: Delete user and logout
});

export default { route: "/user", router: hono } as IRouterExport;
