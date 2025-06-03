-- PASO 1: Crear las tablas Organization y OrgDomain
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(64) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "OrgDomain" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL,
    "domain" varchar(64) NOT NULL,
    CONSTRAINT "OrgDomain_domain_unique" UNIQUE("domain")
);

-- PASO 2: Crear una organización por defecto
INSERT INTO "Organization" ("name") 
VALUES ('Organización Por Defecto') 
ON CONFLICT DO NOTHING;

-- PASO 3: Obtener el ID de la organización por defecto
-- (esto se hará en el siguiente paso dentro de la migración)

-- PASO 4: Agregar la columna org_id como NULLABLE primero
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "org_id" uuid;

-- PASO 5: Actualizar todos los usuarios existentes con la organización por defecto
UPDATE "User" 
SET "org_id" = (SELECT "id" FROM "Organization" WHERE "name" = 'Organización Por Defecto' LIMIT 1)
WHERE "org_id" IS NULL;

-- PASO 6: Ahora hacer la columna NOT NULL
ALTER TABLE "User" ALTER COLUMN "org_id" SET NOT NULL;

-- PASO 7: Agregar las foreign keys
DO $$ BEGIN
    ALTER TABLE "OrgDomain" ADD CONSTRAINT "OrgDomain_org_id_Organization_id_fk" 
    FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("id") 
    ON DELETE cascade ON UPDATE no action;
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_org_id_Organization_id_fk" 
    FOREIGN KEY ("org_id") REFERENCES "public"."Organization"("id") 
    ON DELETE restrict ON UPDATE no action;
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;