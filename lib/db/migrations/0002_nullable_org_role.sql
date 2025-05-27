ALTER TABLE "User" ALTER COLUMN "organizationId" DROP NOT NULL;

--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "roleId" DROP NOT NULL;