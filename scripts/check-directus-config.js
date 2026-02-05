// Скрипт для проверки конфигурации Directus
// Запуск: node scripts/check-directus-config.js

const DIRECTUS_URL = "https://directus.arena-api.ru";

// Получаем токены из аргументов или env
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
const USER_TOKEN = process.env.DIRECTUS_USER_TOKEN; // Токен branch-admin для проверки

async function checkConfig() {
  console.log("🔍 Проверка конфигурации Directus\n");
  console.log("URL:", DIRECTUS_URL);
  console.log("Admin token:", ADMIN_TOKEN ? "✅ Указан" : "❌ Не указан");
  console.log("User token:", USER_TOKEN ? "✅ Указан" : "❌ Не указан (опционально)");
  console.log("");

  if (!ADMIN_TOKEN) {
    console.log("⚠️  Для полной проверки укажите ADMIN_TOKEN:");
    console.log("   set DIRECTUS_ADMIN_TOKEN=ваш_токен && node scripts/check-directus-config.js\n");
  }

  // 1. Проверяем доступность сервера
  console.log("1️⃣ Проверка доступности сервера...");
  try {
    const healthRes = await fetch(`${DIRECTUS_URL}/server/health`);
    if (healthRes.ok) {
      console.log("   ✅ Сервер доступен");
    } else {
      console.log("   ⚠️  Сервер вернул:", healthRes.status);
    }
  } catch (err) {
    console.log("   ❌ Сервер недоступен:", err.message);
    return;
  }

  // 2. Проверяем коллекцию games
  console.log("\n2️⃣ Проверка коллекции games...");
  try {
    const gamesRes = await fetch(`${DIRECTUS_URL}/items/games?fields=id,name,price_per_player,category&limit=3`, {
      headers: ADMIN_TOKEN ? { "Authorization": `Bearer ${ADMIN_TOKEN}` } : {}
    });
    
    if (gamesRes.ok) {
      const gamesData = await gamesRes.json();
      const games = gamesData.data || [];
      console.log(`   ✅ Коллекция games доступна (${games.length} игр)`);
      
      // Проверяем наличие полей
      if (games.length > 0) {
        const sample = games[0];
        console.log("   📋 Поля в ответе:");
        console.log("      - id:", sample.id !== undefined ? "✅" : "❌");
        console.log("      - name:", sample.name !== undefined ? "✅" : "❌");
        console.log("      - price_per_player:", sample.price_per_player !== undefined ? "✅" : "❌");
        console.log("      - category:", sample.category !== undefined ? "✅" : "❌");
        
        // Показываем игры с ценами
        console.log("\n   💰 Игры с ценами:");
        games.forEach(g => {
          const price = g.price_per_player ? `${g.price_per_player} ₸` : "не указана";
          console.log(`      - ${g.name}: ${price}`);
        });
      }
    } else {
      console.log("   ❌ Ошибка доступа к games:", gamesRes.status);
    }
  } catch (err) {
    console.log("   ❌ Ошибка:", err.message);
  }

  // 3. Проверяем коллекцию bookings (если есть admin token)
  if (ADMIN_TOKEN) {
    console.log("\n3️⃣ Проверка коллекции bookings...");
    try {
      const bookingsRes = await fetch(`${DIRECTUS_URL}/items/bookings?limit=1`, {
        headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (bookingsRes.ok) {
        console.log("   ✅ Коллекция bookings доступна");
      } else if (bookingsRes.status === 403) {
        console.log("   ⚠️  Нет доступа к bookings (403)");
      } else {
        console.log("   ❌ Ошибка:", bookingsRes.status);
      }
    } catch (err) {
      console.log("   ❌ Ошибка:", err.message);
    }

    // 4. Проверяем роли
    console.log("\n4️⃣ Проверка ролей...");
    try {
      const rolesRes = await fetch(`${DIRECTUS_URL}/roles?fields=id,name`, {
        headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const roles = rolesData.data || [];
        console.log("   📋 Доступные роли:");
        roles.forEach(r => {
          const marker = r.name === "branch-admin" ? " 👈" : "";
          console.log(`      - ${r.name}${marker}`);
        });
        
        const branchAdmin = roles.find(r => r.name === "branch-admin");
        if (!branchAdmin) {
          console.log("\n   ⚠️  Роль branch-admin не найдена!");
        }
      }
    } catch (err) {
      console.log("   ❌ Ошибка:", err.message);
    }

    // 5. Проверяем permissions для branch-admin
    console.log("\n5️⃣ Проверка permissions для branch-admin...");
    try {
      const rolesRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=branch-admin&fields=id`, {
        headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
      });
      const rolesData = await rolesRes.json();
      const roleId = rolesData.data?.[0]?.id;
      
      if (roleId) {
        const permsRes = await fetch(`${DIRECTUS_URL}/permissions?filter[role][_eq]=${roleId}&fields=collection,action&limit=100`, {
          headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (permsRes.ok) {
          const permsData = await permsRes.json();
          const perms = permsData.data || [];
          
          console.log("   📋 Текущие permissions:");
          const collections = {};
          perms.forEach(p => {
            if (!collections[p.collection]) collections[p.collection] = [];
            collections[p.collection].push(p.action);
          });
          
          Object.entries(collections).forEach(([coll, actions]) => {
            console.log(`      - ${coll}: ${actions.join(", ")}`);
          });
          
          // Проверяем что нужно
          const bookingsPerms = perms.filter(p => p.collection === "bookings").map(p => p.action);
          const clientsPerms = perms.filter(p => p.collection === "clients").map(p => p.action);
          
          console.log("\n   ✅ Проверка необходимых прав:");
          console.log(`      bookings (create): ${bookingsPerms.includes("create") ? "✅" : "❌ НЕТ"}`);
          console.log(`      bookings (read): ${bookingsPerms.includes("read") ? "✅" : "❌ НЕТ"}`);
          console.log(`      clients (create): ${clientsPerms.includes("create") ? "✅" : "❌ НЕТ"}`);
          console.log(`      clients (read): ${clientsPerms.includes("read") ? "✅" : "❌ НЕТ"}`);
        }
      }
    } catch (err) {
      console.log("   ❌ Ошибка:", err.message);
    }

    // 6. Проверяем поле arena у users
    console.log("\n6️⃣ Проверка поля arena у пользователей...");
    try {
      const fieldsRes = await fetch(`${DIRECTUS_URL}/fields/directus_users`, {
        headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        const fields = fieldsData.data || [];
        const arenaField = fields.find(f => f.field === "arena");
        
        if (arenaField) {
          console.log("   ✅ Поле arena найдено");
          console.log("   📋 Тип:", arenaField.type);
          console.log("   📋 Special:", arenaField.meta?.special?.join(", ") || "none");
        } else {
          console.log("   ❌ Поле arena НЕ найдено!");
          console.log("   💡 Создайте поле:");
          console.log("      Settings → Data Model → directus_users → Create Field");
          console.log("      Type: Many-to-One, Related: arenas");
        }
      }
    } catch (err) {
      console.log("   ❌ Ошибка:", err.message);
    }
  }

  // 7. Тест с user token
  if (USER_TOKEN) {
    console.log("\n7️⃣ Тест с user token (branch-admin)...");
    try {
      const testRes = await fetch(`${DIRECTUS_URL}/items/bookings?limit=1`, {
        headers: { "Authorization": `Bearer ${USER_TOKEN}` }
      });
      
      if (testRes.ok) {
        console.log("   ✅ User token работает для bookings");
      } else if (testRes.status === 403) {
        console.log("   ❌ User token: 403 Forbidden - нет прав!");
      } else {
        console.log("   ⚠️  User token:", testRes.status);
      }
    } catch (err) {
      console.log("   ❌ Ошибка:", err.message);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📖 Следующие шаги:");
  console.log("");
  console.log("1. Если нет прав на bookings/clients, запустите:");
  console.log("   set DIRECTUS_ADMIN_TOKEN=ваш_токен");
  console.log("   node scripts/setup-bookings-permissions.js");
  console.log("");
  console.log("2. Если поле arena не найдено, создайте его в:");
  console.log("   Settings → Data Model → directus_users");
  console.log("");
  console.log("3. Заполните price_per_player у игр в коллекции games");
  console.log("=".repeat(50));
}

checkConfig();
