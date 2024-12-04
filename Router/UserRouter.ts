import { Hono } from "npm:hono";
import IRouterExport from "../Interfaces/Interface.ts";
import { LoginMiddleware } from "../Middleware/Middlewares.ts";
import { validator as zValidator } from "npm:hono-openapi/zod";
import {
	userCreateSchema,
	userLoginSchema,
	userUpdatePasswordSchema,
	userUpdateSchema,
} from "../Schema/ZodSchema.ts";
import { hash, Variant, verify, Version } from "jsr:@felix/argon2";
import dbClient from "../Client/DirzzleClient.ts";
import { user } from "../Schema/DatabaseSchema.ts";
import { eq } from "drizzle-orm";
import { Session } from "npm:hono-sessions";
import { ISession } from "../Types/Type.ts";
import { describeRoute } from "hono-openapi";

const hono = new Hono<{
	Variables: { session: Session<ISession>; session_key_rotation: boolean };
}>();

hono.post(
	"register",
	describeRoute({ description: "Register an user" ,responses: {
		201: { description: "Successfully register" },
		400: {
			description: "Username duplicated"
		},
	}}),
	zValidator("json", userCreateSchema),
	async (c) => {
		const { username, password, name } = c.req.valid("json");
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
		try {
			const userInserted = await dbClient
				.insert(user)
				.values(objectToInsert)
				.returning();
			return c.json(userInserted,201);
		} catch (e) {
			return c.json({ message: "User Insertion Failed" }, 400);
		}
	},
);

hono.post(
	"login",
	describeRoute({ description: "User Login" ,responses: {
		201: { description: "Login successful" },
		401: {
			description: "Login fail",
		},
	}}),
	zValidator("json", userLoginSchema),
	async (c) => {
		const { username, password } = c.req.valid("json");
		const userFound = await dbClient.query.user.findFirst({
			where: eq(user.username, username),
		});
		if (!user) {
			return c.json({ message: "Password or username incorrect" }, 401);
		}
		const passwordCorrect = await verify(userFound.password, password);
		if (!passwordCorrect) {
			return c.json({ message: "Password or username incorrect" }, 401);
		}
		const session = c.get("session");
		const { password: _, ...leftUser } = userFound;
		session.set("user", leftUser);
		return c.json(leftUser,201);
	},
);

hono.get(
	"logout",
	describeRoute({ description: "User Logout",responses: {
		200: { description: "Logged out" },
		401:{
			description:"Not logged in"
		}
	} }),
	LoginMiddleware,
	(c) => {
		c.get("session").deleteSession();
		return c.json({ message: "You have been logged out" });
	},
);

hono.get(
	"profile",
	describeRoute({ description: "Retrieve current user data",responses: {
		200: { description: "Successfully retrieved profile" },
		401:{
			description:"Not logged in"
		}
	} }),
	LoginMiddleware,
	(c) => {
		return c.json(c.get("session").get("user"));
	},
);

hono.patch(
	"update",
	describeRoute({ description: "Update user information",responses: {
		201: { description: "User updated" },
		401:{
			description:"Not logged in"
		}
	} }),
	LoginMiddleware,
	zValidator("json", userUpdateSchema),
	async (c) => {
		const session = c.get("session");
		const userData = session.get("user");
		const updateSchema = c.req.valid("json");
		const userUpdated = await dbClient.update(user).set({ ...updateSchema })
			.where(eq(user.id, userData.id)).returning({
				username: user.username,
				name: user.name,
				id: user.id,
			});
		session.set("user", userUpdated);
		return c.json(userUpdated,201);
	},
);

hono.patch(
	"updatePassword",
	describeRoute({ description: "Update user password (Need login)",responses: {
		201: { description: "Password updated" },
		400: {
			description: "Password not match",
		},
		401:{
			description:"Not logged in"
		}
	} }),
	LoginMiddleware,
	zValidator("json", userUpdatePasswordSchema),
	async (c) => {
		const { oldPassword, newPassword, newPasswordAgain } = c.req.valid("json");
		const userInSession = c.get("session").get("user");
		const userFound = await dbClient.query.user.findFirst({
			where: eq(user.id, userInSession.id),
		});
		const oldPasswordCorrect = await verify(
			userFound.password,
			oldPassword,
		);
		if (!oldPasswordCorrect) {
			return c.json({ message: "Old Password Incorrect" }, 400);
		}
		if (newPassword != newPasswordAgain) {
			return c.json({ message: "New password confirmation failed" }, 400);
		}
		if (newPassword == oldPassword) {
			return c.json(
				{ message: "New password is same as old password" },
				400,
			);
		}
		await dbClient
			.update(user)
			.set({ password: newPassword })
			.where(eq(user.id, userInSession.id));
		return c.text("Password updated",201);
	},
);

export default { route: "/user", router: hono } as IRouterExport;
