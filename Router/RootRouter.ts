import { Hono } from "jsr:@hono/hono";
import IRouterExport from "../Interfaces/Interface.ts";
import { hash, verify } from "jsr:@felix/argon2";

const router = new Hono();

router.get("/hash/:pwd", async (c) => {
	const { pwd } = c.req.param();
	return c.text(await hash(pwd, { timeCost: 7, lanes: 7 }));
});

router.get("/env", (c) => {
	return c.text(Deno.env.get("ENV"));
});

router.get("/:id", (c) => {
	return c.text(c.req.param("id"));
});

export default { route: "/", router } as IRouterExport;
