import { Hono } from "jsr:@hono/hono";

export default interface IRouterExport {
	route: string;
	router: Hono;
}
