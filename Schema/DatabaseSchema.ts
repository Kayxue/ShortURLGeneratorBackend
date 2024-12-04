import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "npm:nanoid";

export const users = pgTable("user", {
	id: varchar("id", { length: 21 }).primaryKey().notNull().$defaultFn(() =>
		nanoid()
	),
	username: text("username").unique().notNull(),
	password: text("password").notNull(),
	name: text("name").notNull(),
});

export const shortUrls = pgTable("shortUrl", {
	param: text("param").primaryKey().notNull().$defaultFn(() => nanoid(8)),
	url: text("url").notNull(),
	userId: varchar("userId", { length: 21 }).references(() => users.id, {
		onDelete: "set null",
	}),
	password: text("password"),
	expiredTime: timestamp("expiredTime", { mode: "date" }),
});

export const shortUrlAnalytics = pgTable("shortUrlAnalytic", {
	param: text("param").notNull().references(() => shortUrls.param, {
		onDelete: "cascade",
	}),
	country: text("country").notNull(),
	count: integer("count").notNull(),
}, (t) => [primaryKey({ columns: [t.param, t.country] })]);

export const userToShortRelation = relations(users, ({ many }) => ({
	urls: many(shortUrls),
}));

export const shortToUserRelation = relations(shortUrls, ({ one, many }) => ({
	user: one(users, {
		fields: [shortUrls.userId],
		references: [users.id],
	}),
	analytic: many(shortUrlAnalytics),
}));
