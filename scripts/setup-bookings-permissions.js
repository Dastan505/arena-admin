// Скрипт для настройки прав доступа к коллекции bookings
// Запуск: node scripts/setup-bookings-permissions.js

const DIRECTUS_URL = "https://directus.arena-api.ru";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

async function setupPermissions() {
  if (!ADMIN_TOKEN) {
    console.error("❌ Установите переменную окружения DIRECTUS_ADMIN_TOKEN");
    console.log("Пример: set DIRECTUS_ADMIN_TOKEN=your_token_here && node scripts/setup-bookings-permissions.js");
    process.exit(1);
  }

  try {
    // 1. Получаем ID роли branch-admin
    console.log("🔍 Ищем роль branch-admin...");
    const rolesRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=branch-admin&fields=id,name`, {
      headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (!rolesRes.ok) {
      throw new Error(`Failed to fetch roles: ${await rolesRes.text()}`);
    }
    
    const rolesData = await rolesRes.json();
    const branchAdminRole = rolesData.data?.[0];
    
    if (!branchAdminRole) {
      console.error("❌ Роль branch-admin не найдена!");
      console.log("Создайте роль вручную в Directus: Settings → Access Control → Add Role");
      process.exit(1);
    }
    
    console.log(`✅ Найдена роль: ${branchAdminRole.name} (ID: ${branchAdminRole.id})`);
    
    const roleId = branchAdminRole.id;
    
    // 2. Проверяем существующие permissions для bookings
    console.log("\n🔍 Проверяем текущие permissions...");
    const permsRes = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=bookings&filter[role][_eq]=${roleId}&fields=id,action`, {
      headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
    });
    
    const existingPerms = permsRes.ok ? await permsRes.json() : { data: [] };
    console.log(`Найдено ${existingPerms.data?.length || 0} существующих permissions`);
    
    // 3. Создаем необходимые permissions
    const requiredActions = ['create', 'read', 'update'];
    
    for (const action of requiredActions) {
      const exists = existingPerms.data?.some(p => p.action === action);
      
      if (exists) {
        console.log(`ℹ️ Permission '${action}' уже существует`);
        continue;
      }
      
      console.log(`📦 Создаем permission '${action}'...`);
      
      const payload = {
        role: roleId,
        collection: "bookings",
        action: action,
        fields: action === 'create' ? ['*'] : ['*'],
        permissions: action === 'create' ? {
          // При создании разрешаем только для арены пользователя
          _and: [
            {
              arena: {
                _eq: "$CURRENT_USER.arena"
              }
            }
          ]
        } : {
          // При чтении/обновлении - только своя арена
          arena: {
            _eq: "$CURRENT_USER.arena"
          }
        },
        validation: null,
        presets: null
      };
      
      const createRes = await fetch(`${DIRECTUS_URL}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(payload)
      });
      
      if (createRes.ok) {
        console.log(`✅ Permission '${action}' создан`);
      } else {
        const error = await createRes.text();
        console.error(`❌ Ошибка создания '${action}': ${error}`);
      }
    }
    
    // 4. Проверяем что поле arena есть в коллекции users
    console.log("\n🔍 Проверяем поле 'arena' в коллекции users...");
    const userFieldsRes = await fetch(`${DIRECTUS_URL}/fields/directus_users`, {
      headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (userFieldsRes.ok) {
      const fieldsData = await userFieldsRes.json();
      const arenaField = fieldsData.data?.find(f => f.field === 'arena');
      
      if (!arenaField) {
        console.warn("⚠️ Поле 'arena' не найдено в users! Нужно создать:");
        console.log("   Settings → Data Model → directus_users → Add Field");
        console.log("   Type: Many-to-One, Related Collection: arenas");
      } else {
        console.log("✅ Поле 'arena' найдено в users");
      }
    }
    
    console.log("\n🎉 Настройка завершена!");
    console.log("\n⚠️ ВАЖНО: Убедитесь что:");
    console.log("   1. У пользователей с ролью branch-admin заполнено поле 'arena'");
    console.log("   2. Поле 'arena' в bookings связано с коллекцией 'arenas'");
    
  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    process.exit(1);
  }
}

setupPermissions();
