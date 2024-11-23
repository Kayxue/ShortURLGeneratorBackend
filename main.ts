import { Hono } from "jsr:@hono/hono";
import { cors } from "jsr:@hono/hono/cors";
import { expandGlob } from "jsr:@std/fs";
import { zValidator } from "npm:@hono/zod-validator";
import IRouterExport from "./Interfaces/Interface.ts";

const hono = new Hono();

hono.use(cors());

hono.get("/", (c) => {
	return c.text("Welcome to the ShortURL Backend");
});

for await (const file of expandGlob(`${Deno.cwd()}/Router/**/*.ts`)) {
	const { route, router }: IRouterExport =
		(await import(`file://${file.path}`)).default;
	hono.route(route, router);
}

Deno.serve({ port: 3000 }, hono.fetch);
