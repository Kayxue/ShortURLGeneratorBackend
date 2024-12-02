import { z } from "npm:zod";

export const createUrlSchema = z.object({
	param: z.string().optional(),
	url: z.string().url(),
	password: z.string().optional(),
	expiredDate: z.string().datetime().optional(),
});

export const shortUrlPasswordVerificationSchema = z.object({
	password: z.string(),
});

export const userCreateSchema = z.object({
	username: z.string(),
	password: z.string(),
	name: z.string(),
});

export const userLoginSchema = z.object({
	username: z.string(),
	password: z.string(),
});

export const userUpdateSchema = z.object({
	username: z.string().optional(),
	name: z.string().optional(),
});

export const userUpdatePasswordSchema = z.object({
	oldPassword: z.string(),
	newPassword: z.string(),
	newPasswordAgain: z.string(),
});
