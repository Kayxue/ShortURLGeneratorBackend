import { Hono } from "npm:hono";
import { zValidator } from "npm:@hono/zod-validator";
import { hash, Variant, verify, Version } from "jsr:@felix/argon2";
import IRouterExport from "../Interfaces/Interface.ts";
import {
	createUrlSchema,
	shortUrlPasswordVerificationSchema,
} from "../Schema/ZodSchema.ts";
import { LoginMiddleware } from "../Middleware/Middlewares.ts";
import dbClient from "../Client/DirzzleClient.ts";
import { eq } from "drizzle-orm";
import { shortUrl } from "../Schema/DatabaseSchema.ts";
import moment from "npm:moment-timezone";
import { Session } from "npm:hono-sessions";
import { ISession } from "../Types/Type.ts";

const hono = new Hono<{
	Variables: { session: Session<ISession>; session_key_rotation: boolean };
}>();

hono.post("/create", zValidator("json", createUrlSchema), async (c) => {
	const { param, url, password, expiredDate } = c.req.valid("json");
	const user = c.get("session").get("user");
	const dataToPush = {
		param,
		user: user ? user.id : null,
		url,
		password: await hash(password, {
			variant: Variant.Argon2id,
			version: Version.V13,
			timeCost: 8,
			lanes: 8,
		}),
		expiredDate,
	};
	try {
		const data = await dbClient
			.insert(shortUrl)
			.values(dataToPush)
			.returning();
		return c.json(data);
	} catch (e) {
		return c.json("Pushed Failed", 400);
	}
});

hono.get("/:param", async (c) => {
	const { param } = c.req.param();
	const shortUrlData = await dbClient.query.shortUrl.findFirst({
		where: eq(shortUrl.param, param),
	});
	if (!shortUrlData) {
		return c.json({ message: "The shorturl is not valid" }, 400);
	}
	if (shortUrlData.password?.length) return c.json("Need Password", 200);
	if (
		moment(shortUrlData.expireDate)
			.tz("Asia/Taipei")
			.diff(moment(new Date()).tz("Asia/Taipei")) < 0
	) {
		return c.json({ message: "This url has already expired" }, 400);
	}
	return c.text(shortUrlData.url, 201);
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
	async (c) => {
		const { param } = c.req.param();
		const { password } = c.req.valid("json");
		const { password: correctPassword, ...shortUrlData } = await dbClient.query
			.shortUrl.findFirst({
				where: eq(shortUrl.param, param),
			});
		if (!shortUrlData) {
			return c.json({ message: "The shorturl is not valid" }, 400);
		}
		if (!correctPassword?.length) return c.json(shortUrlData, 201);
		const passwordCorrect = await verify(correctPassword, password);
		if (passwordCorrect) return c.json(shortUrlData, 201);
		return c.json({ message: "Password verification failed" }, 400);
	},
);

export default { route: "/shorturl", router: hono } as IRouterExport;
