import { Hono } from "npm:hono";

export default interface IRouterExport {
	route: string;
	router: Hono<any>;
}
