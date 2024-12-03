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
import { hash, Variant, verify, Version } from "jsr:@felix/argon2";
import dbClient from "../Client/DirzzleClient.ts";
import { user } from "../Schema/DatabaseSchema.ts";
import { eq } from "drizzle-orm";
import { Session } from "npm:hono-sessions";
import { ISession } from "../Types/Type.ts";

const hono = new Hono<{
	Variables: { session: Session<ISession>; session_key_rotation: boolean };
}>();

hono.post("register", zValidator("json", userCreateSchema), async (c) => {
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
		return c.json(userInserted);
	} catch (e) {
		return c.json({ message: "User Insertion Failed" }, 400);
	}
});

hono.post("login", zValidator("json", userLoginSchema), async (c) => {
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
	return c.json(leftUser);
});

hono.patch(
	"update",
	LoginMiddleware,
	zValidator("json", userUpdateSchema),
	async (c) => {
		const session=c.get("session")
		const userData=session.get("user")
		const updateSchema=c.req.valid("json")
		const userUpdated=await dbClient.update(user).set({...updateSchema}).where(eq(user.id,userData.id)).returning({username:user.username,name:user.name,id:user.id})
		session.set("user",userUpdated)
		return c.json(userUpdated);
	},
);

hono.get("profile", LoginMiddleware, (c) => {
	return c.get("session").get("user");
});

hono.patch(
	"updatePassword",
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
		return c.text("Password updated");
	},
);

export default { route: "/user", router: hono } as IRouterExport;
