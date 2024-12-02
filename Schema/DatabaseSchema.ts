import { pgTable, text, timestamp, varchar } from "npm:drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "npm:nanoid";

export const user = pgTable("user", {
	id: varchar("id", { length: 21 }).primaryKey().notNull().$defaultFn(() =>
		nanoid()
	),
	username: text("username").unique().notNull(),
	password: text("password").notNull(),
	name: text("name").notNull(),
});

export const shortUrl = pgTable("shortUrl", {
	param: text("param").primaryKey().notNull().$defaultFn(() => nanoid(8)),
	url: text("url").notNull(),
	userId: varchar("userId", { length: 21 }).references(() => user.id, {
		onDelete: "set null",
	}),
	password: text("password"),
	expireDate: timestamp({ mode: "date" }),
});

export const userToShortRelation = relations(user, ({ many }) => ({
	urls: many(shortUrl),
}));

export const shortToUserRelation = relations(shortUrl, ({ one }) => ({
	user: one(user, {
		fields: [shortUrl.userId],
		references: [user.id],
	}),
}));
