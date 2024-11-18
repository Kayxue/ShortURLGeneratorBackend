import { Hono } from "jsr:@hono/hono";
import IRouterExport from "../Interfaces/Interface.ts";

const router = new Hono();
router.get("/:id", (c) => {
	return c.text(c.req.param("id"));
});

export default { route: "/", router } as IRouterExport;
