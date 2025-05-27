import { config } from 'dotenv';
import {
  createOrganization,
  createRole,
  createIntegration,
  getOrganizationById,
  getRoleById,
  getIntegrationById,
  getAllOrganizations,
  getAllRoles,
  getIntegrationsByOrganizationId,
  createUser,
  getUserWithOrganizationAndRole,
  getUsersByOrganizationId,
} from './queries';

// Cargar variables de entorno
config({ path: '.env.local' });

async function testNewQueries() {
  console.log('🧪 Iniciando pruebas de las nuevas queries...\n');

  try {
    // 1. Crear una organización
    console.log('1️⃣ Creando organización...');
    const org = await createOrganization({
      name: 'Empresa de Prueba',
      description: 'Una organización para testing',
      planType: 'premium',
    });
    console.log('✅ Organización creada:', org);

    // 2. Crear roles
    console.log('\n2️⃣ Creando roles...');
    const adminRole = await createRole({
      name: 'Admin',
      description: 'Administrador del sistema',
      permissions: {
        canManageUsers: true,
        canManageOrganization: true,
        canManageIntegrations: true,
      },
    });
    console.log('✅ Rol Admin creado:', adminRole);

    const userRole = await createRole({
      name: 'User',
      description: 'Usuario estándar',
      permissions: {
        canManageUsers: false,
        canManageOrganization: false,
        canManageIntegrations: false,
      },
    });
    console.log('✅ Rol User creado:', userRole);

    // 3. Crear integración
    console.log('\n3️⃣ Creando integración...');
    const integration = await createIntegration({
      name: 'Slack Integration',
      type: 'slack',
      config: {
        webhookUrl: 'https://hooks.slack.com/test',
        channel: '#general',
        botToken: 'xoxb-test-token',
      },
      organizationId: org.id,
    });
    console.log('✅ Integración creada:', integration);

    // 4. Crear usuario con organización y rol
    console.log('\n4️⃣ Creando usuario con organización y rol...');
    const user = await createUser({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Juan',
      lastName: 'Pérez',
      organizationId: org.id,
      roleId: adminRole.id,
    });
    console.log('✅ Usuario creado:', user);

    // 5. Obtener datos por ID
    console.log('\n5️⃣ Obteniendo datos por ID...');
    const orgById = await getOrganizationById(org.id);
    const roleById = await getRoleById(adminRole.id);
    const integrationById = await getIntegrationById(integration.id);

    console.log('✅ Organización obtenida:', orgById?.name);
    console.log('✅ Rol obtenido:', roleById?.name);
    console.log('✅ Integración obtenida:', integrationById?.name);

    // 6. Obtener listas
    console.log('\n6️⃣ Obteniendo listas...');
    const allOrgs = await getAllOrganizations();
    const allRoles = await getAllRoles();
    const orgIntegrations = await getIntegrationsByOrganizationId(org.id);

    console.log('✅ Total organizaciones:', allOrgs.length);
    console.log('✅ Total roles:', allRoles.length);
    console.log('✅ Integraciones de la org:', orgIntegrations.length);

    // 7. Obtener usuario con relaciones
    console.log('\n7️⃣ Obteniendo usuario con relaciones...');
    const userWithRelations =
      await getUserWithOrganizationAndRole('test@example.com');
    console.log('✅ Usuario con relaciones:', {
      email: userWithRelations?.email,
      organization: userWithRelations?.organization?.name,
      role: userWithRelations?.role?.name,
    });

    // 8. Obtener usuarios por organización
    console.log('\n8️⃣ Obteniendo usuarios por organización...');
    const orgUsers = await getUsersByOrganizationId(org.id);
    console.log('✅ Usuarios en la organización:', orgUsers.length);

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    throw error;
  }
}

// Ejecutar las pruebas
testNewQueries()
  .then(() => {
    console.log('\n✨ Pruebas finalizadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
