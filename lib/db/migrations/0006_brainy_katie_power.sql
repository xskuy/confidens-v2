ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "first_name" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "last_name" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE("email");