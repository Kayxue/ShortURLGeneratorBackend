import { z } from "npm:zod";

export const createUrlSchema = z.object({
	userId: z.string().optional(),
	param: z.string().optional(),
	url: z.string(),
	password: z.string().optional(),
});

export const shortUrlPasswordVerificationSchema = z.object({
	param: z.string(),
	password: z.string(),
});
