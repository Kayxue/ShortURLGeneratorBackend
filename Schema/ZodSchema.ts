import { z } from "@hono/zod-openapi";

export const createUrlSchema = z.object({
	param: z.string().optional().openapi({
		param: { name: "param", description: "Param of shorturl" },
	}),
	url: z.string().url().openapi({
		param: {
			name: "url",
			description: "The url the shorturl will redirect to.",
		},
	}),
	password: z.string().optional().openapi({
		param: {
			name: "password",
			description: "Shorturl for shorturl protection",
		},
	}),
	expiredTime: z.string().datetime().optional().openapi({
		param: { name: "expiredTime", description: "Expire time of the shorturl" },
	}),
});

export const shortUrlPasswordVerificationSchema = z.object({
	password: z.string().openapi({
		param: { name: "password", description: "Password to verify." },
	}),
});

export const userCreateSchema = z.object({
	username: z.string().openapi({
		param: { name: "username", description: "Username of the new user" },
	}),
	password: z.string().openapi({
		param: { name: "password", description: "Password of the new user" },
	}),
	name: z.string().openapi({
		param: { name: "name", description: "Name of the new user" },
	}),
});

export const userLoginSchema = z.object({
	username: z.string().openapi({
		param: { name: "username", description: "Username of login user" },
	}),
	password: z.string().openapi({
		param: { name: "password", description: "Password of login user" },
	}),
});

export const userUpdateSchema = z.object({
	username: z.string().optional().openapi({
		param: {
			name: "username",
			description: "Username the user want to change to",
		},
	}),
	name: z.string().optional().openapi({
		param: { name: "name", description: "Name the user want to change to" },
	}),
});

export const userUpdatePasswordSchema = z.object({
	oldPassword: z.string().openapi({
		param: { name: "oldPassword", description: "Old password confirmation" },
	}),
	newPassword: z.string().openapi({
		param: {
			name: "newPassword",
			description: "New password the user want to change to",
		},
	}),
	newPasswordAgain: z.string().openapi({
		param: {
			name: "newPasswordAgain",
			description: "New password confirmation",
		},
	}),
});
