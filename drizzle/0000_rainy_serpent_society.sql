CREATE TABLE IF NOT EXISTS "shortUrlAnalytic" (
	"param" text NOT NULL,
	"country" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "shortUrlAnalytic_param_country_pk" PRIMARY KEY("param","country")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shortUrl" (
	"param" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"userId" varchar(21),
	"password" text,
	"expiredTime" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortUrlAnalytic" ADD CONSTRAINT "shortUrlAnalytic_param_shortUrl_param_fk" FOREIGN KEY ("param") REFERENCES "public"."shortUrl"("param") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shortUrl" ADD CONSTRAINT "shortUrl_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
