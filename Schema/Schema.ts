import { z } from "npm:zod";

export const createUrlSchema = z.object({
	userId: z.string().optional(),
	customParam: z.string().optional(),
	url:z.string(),
	password: z.string().optional(),
});
