import { config } from 'dotenv';
import { db } from './utils';
import { sql } from 'drizzle-orm';

// Cargar variables de entorno
config({ path: '.env.local' });

async function setupRLS() {
  console.log('🔒 Configurando Row Level Security (RLS)...\n');

  try {
    // 1. Habilitar RLS en todas las tablas
    console.log('1️⃣ Habilitando RLS en las tablas...');

    await db.execute(
      sql`ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;`,
    );
    await db.execute(sql`ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "Message_v2" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "Vote_v2" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;`);
    await db.execute(sql`ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;`);

    console.log('✅ RLS habilitado en todas las tablas');

    // 2. Crear función para obtener la organización del usuario actual
    console.log('\n2️⃣ Creando función de contexto de usuario...');

    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_current_user_org_id()
      RETURNS uuid AS $$
      BEGIN
        -- Obtener el organizationId del usuario actual desde el contexto de la sesión
        RETURN COALESCE(
          current_setting('app.current_user_org_id', true)::uuid,
          NULL
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('✅ Función de contexto creada');

    // 3. Políticas para Organization
    console.log('\n3️⃣ Creando políticas para Organization...');

    await db.execute(sql`
      CREATE POLICY "Users can only see their own organization"
      ON "Organization"
      FOR ALL
      USING (id = get_current_user_org_id());
    `);

    console.log('✅ Políticas de Organization creadas');

    // 4. Políticas para User
    console.log('\n4️⃣ Creando políticas para User...');

    await db.execute(sql`
      CREATE POLICY "Users can only see users from their organization"
      ON "User"
      FOR ALL
      USING (
        "organizationId" = get_current_user_org_id() 
        OR "organizationId" IS NULL
      );
    `);

    console.log('✅ Políticas de User creadas');

    // 5. Políticas para Integration
    console.log('\n5️⃣ Creando políticas para Integration...');

    await db.execute(sql`
      CREATE POLICY "Users can only see integrations from their organization"
      ON "Integration"
      FOR ALL
      USING ("organizationId" = get_current_user_org_id());
    `);

    console.log('✅ Políticas de Integration creadas');

    // 6. Políticas para Chat
    console.log('\n6️⃣ Creando políticas para Chat...');

    await db.execute(sql`
      CREATE POLICY "Users can only see their own chats or chats from their org users"
      ON "Chat"
      FOR ALL
      USING (
        "userId" IN (
          SELECT id FROM "User" 
          WHERE "organizationId" = get_current_user_org_id()
          OR id = current_setting('app.current_user_id', true)::uuid
        )
      );
    `);

    console.log('✅ Políticas de Chat creadas');

    // 7. Políticas para Message_v2
    console.log('\n7️⃣ Creando políticas para Message_v2...');

    await db.execute(sql`
      CREATE POLICY "Users can only see messages from accessible chats"
      ON "Message_v2"
      FOR ALL
      USING (
        "chatId" IN (
          SELECT id FROM "Chat"
          WHERE "userId" IN (
            SELECT id FROM "User" 
            WHERE "organizationId" = get_current_user_org_id()
            OR id = current_setting('app.current_user_id', true)::uuid
          )
        )
      );
    `);

    console.log('✅ Políticas de Message_v2 creadas');

    // 8. Políticas para Vote_v2
    console.log('\n8️⃣ Creando políticas para Vote_v2...');

    await db.execute(sql`
      CREATE POLICY "Users can only see votes from accessible chats"
      ON "Vote_v2"
      FOR ALL
      USING (
        "chatId" IN (
          SELECT id FROM "Chat"
          WHERE "userId" IN (
            SELECT id FROM "User" 
            WHERE "organizationId" = get_current_user_org_id()
            OR id = current_setting('app.current_user_id', true)::uuid
          )
        )
      );
    `);

    console.log('✅ Políticas de Vote_v2 creadas');

    // 9. Políticas para Document
    console.log('\n9️⃣ Creando políticas para Document...');

    await db.execute(sql`
      CREATE POLICY "Users can only see documents from their organization users"
      ON "Document"
      FOR ALL
      USING (
        "userId" IN (
          SELECT id FROM "User" 
          WHERE "organizationId" = get_current_user_org_id()
          OR id = current_setting('app.current_user_id', true)::uuid
        )
      );
    `);

    console.log('✅ Políticas de Document creadas');

    // 10. Políticas para Suggestion
    console.log('\n🔟 Creando políticas para Suggestion...');

    await db.execute(sql`
      CREATE POLICY "Users can only see suggestions from accessible documents"
      ON "Suggestion"
      FOR ALL
      USING (
        "documentId" IN (
          SELECT id FROM "Document"
          WHERE "userId" IN (
            SELECT id FROM "User" 
            WHERE "organizationId" = get_current_user_org_id()
            OR id = current_setting('app.current_user_id', true)::uuid
          )
        )
      );
    `);

    console.log('✅ Políticas de Suggestion creadas');

    // 11. Políticas para Role (acceso global para administradores)
    console.log('\n1️⃣1️⃣ Creando políticas para Role...');

    await db.execute(sql`
      CREATE POLICY "All users can see roles"
      ON "Role"
      FOR SELECT
      USING (true);
    `);

    await db.execute(sql`
      CREATE POLICY "Only admins can modify roles"
      ON "Role"
      FOR INSERT, UPDATE, DELETE
      USING (
        current_setting('app.current_user_role', true) = 'admin'
      );
    `);

    console.log('✅ Políticas de Role creadas');

    console.log('\n🎉 ¡RLS configurado exitosamente!');
    console.log(
      'Todas las tablas ahora tienen políticas de seguridad a nivel de fila.',
    );
  } catch (error) {
    console.error('\n❌ Error configurando RLS:', error);
    throw error;
  }
}

// Ejecutar la configuración
setupRLS()
  .then(() => {
    console.log('\n✨ Configuración de RLS completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
