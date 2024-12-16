import { Hono } from "npm:hono";
import { validator as zValidator } from "npm:hono-openapi/zod";
import { hash, Variant, verify, Version } from "jsr:@felix/argon2";
import IRouterExport from "../Interfaces/Interface.ts";
import {
	createUrlSchema,
	shortUrlPasswordVerificationSchema,
	shortUrlUpdateSchema,
} from "../Schema/ZodSchema.ts";
import { LoginMiddleware } from "../Middleware/Middlewares.ts";
import dbClient from "../Client/DirzzleClient.ts";
import { eq, sql } from "drizzle-orm";
import { shortUrlAnalytics, shortUrls } from "../Schema/DatabaseSchema.ts";
import moment from "npm:moment-timezone";
import { Session } from "npm:hono-sessions";
import { ISession } from "../Types/Type.ts";
// @deno-types="npm:@types/geoip-lite"
import geoip from "npm:geoip-lite";
import { describeRoute } from "hono-openapi";

const hono = new Hono<{
	Variables: { session: Session<ISession>; session_key_rotation: boolean };
}>();

hono.post(
	"/create",
	describeRoute({
		description: "Create shorturl",
		responses: {
			201: { description: "Shorturl created" },
			400: {
				description: "Shorturl duplicated",
			},
		},
	}),
	zValidator("json", createUrlSchema),
	async (c) => {
		const { param, url, password, expiredTime } = c.req.valid("json");
		const user = c.get("session").get("user");
		const dataToPush = {
			param,
			userId: user?.id,
			url,
			password: password?.length
				? await hash(password, {
						variant: Variant.Argon2id,
						version: Version.V13,
						timeCost: 8,
						lanes: 8,
				  })
				: undefined,
			expiredTime,
		};
		try {
			const data = await dbClient
				.insert(shortUrls)
				.values(dataToPush)
				.returning();
			return c.json(data, 201);
		} catch (e) {
			return c.json({ message: "Pushed Failed" }, 400);
		}
	}
);

hono.get(
	"/:param",
	describeRoute({
		description: "Get url of shorturl to redirect",
		responses: {
			200: { description: "Shorturl found, but with password protect" },
			201: {
				description:
					"The route doesn't have password protection, will return link to redirect",
			},
			400: {
				description: "Shorturl not found",
			},
		},
	}),
	async (c) => {
		const { param } = c.req.param();
		const shortUrlData = await dbClient.query.shortUrls.findFirst({
			where: eq(shortUrls.param, param),
		});
		if (!shortUrlData) {
			return c.json({ message: "The shorturl is not valid" }, 400);
		}
		if (shortUrlData.password?.length) {
			return c.text("Need Password", 200);
		}
		if (shortUrlData.expiredTime) {
			if (
				moment(shortUrlData.expiredTime)
					.tz("Asia/Taipei")
					.diff(moment(new Date()).tz("Asia/Taipei")) < 0
			) {
				return c.json({ message: "This url has already expired" }, 400);
			}
		}
		//* Add to link analytics (Can't be test on local, need to be test after deployed to flyio)
		const ip = c.req.header("fly-client-ip");
		const country = geoip.lookup(ip).country;
		await dbClient
			.insert(shortUrlAnalytics)
			.values({
				param,
				country,
				count: 1,
			})
			.onConflictDoUpdate({
				target: [shortUrlAnalytics.param, shortUrlAnalytics.country],
				set: { count: sql`${shortUrlAnalytics.count} + 1` },
			});
		return c.text(shortUrlData.url, 201);
	}
);

hono.patch(
	"/:param",
	describeRoute({
		description: "Update shorturl information",
		responses: {
			200: { description: "Update shorturl information successful" },
			400: {
				description: "Shorturl not found",
			},
		},
	}),
	LoginMiddleware,
	zValidator("json", shortUrlUpdateSchema),
	async (c) => {
		const obj = c.req.valid("json");
		const user = c.get("session").get("user");
		const { param } = c.req.param();
		const originalData = await dbClient.query.shortUrls.findFirst({
			where: eq(shortUrls.param, param),
		});
		if (originalData.userId !== user.id)
			return c.json(
				{ message: "This shorturl is not belong to the user" },
				400
			);
		const updated = await dbClient
			.update(shortUrls)
			.set(obj)
			.where(eq(shortUrls.param, param))
			.returning();
		return c.json(updated);
	}
);

hono.get(
	"/:param/info",
	describeRoute({
		description: "Get full info of shorturl",
		responses: {
			200: { description: "Getting info successful" },
			400: {
				description: "Shorturl not found",
			},
		},
	}),
	async (c) => {
		const { param } = c.req.param();
		const { analytics } = c.req.query();
		const shortUrlData = await dbClient.query.shortUrls.findFirst({
			where: eq(shortUrls.param, param),
			with: {
				analytic:
					analytics?.toLowerCase() === "true" ? true : undefined,
			},
		});
		if (!shortUrlData) {
			return c.json({ message: "ShortUrl Data not found" }, 400);
		}
		return c.json(shortUrlData);
	}
);

hono.post(
	"/:param/password",
	describeRoute({
		description: "Verify password for protected shorturl",
		responses: {
			201: { description: "No password protect or password correct" },
			400: {
				description:
					"Shorturl not found or password incorrect (Check message)",
			},
		},
	}),
	zValidator("json", shortUrlPasswordVerificationSchema),
	async (c) => {
		const { param } = c.req.param();
		const { password } = c.req.valid("json");
		const { password: correctPassword, ...shortUrlData } =
			await dbClient.query.shortUrls.findFirst({
				where: eq(shortUrls.param, param),
			});
		if (!shortUrlData) {
			return c.json({ message: "The shorturl is not valid" }, 400);
		}
		if (!correctPassword?.length) return c.json(shortUrlData, 201);
		const passwordCorrect = await verify(correctPassword, password);
		if (passwordCorrect) {
			const ip = c.req.header("fly-client-ip");
			const country = geoip.lookup(ip).country;
			await dbClient
				.insert(shortUrlAnalytics)
				.values({
					param,
					country,
					count: 1,
				})
				.onConflictDoUpdate({
					target: [
						shortUrlAnalytics.param,
						shortUrlAnalytics.country,
					],
					set: { count: sql`${shortUrlAnalytics.count} + 1` },
				});
			return c.json(shortUrlData, 201);
		}
		return c.json({ message: "Password verification failed" }, 400);
	}
);

export default { route: "/shorturl", router: hono } as IRouterExport;
