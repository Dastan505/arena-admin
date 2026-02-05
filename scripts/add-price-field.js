// Скрипт для добавления поля price_per_player в коллекцию games
// Запуск: node scripts/add-price-field.js

const DIRECTUS_URL = "https://directus.arena-api.ru";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN; // Нужен токен администратора

async function createField() {
  if (!ADMIN_TOKEN) {
    console.error("❌ Установите переменную окружения DIRECTUS_ADMIN_TOKEN");
    console.log("Пример: set DIRECTUS_ADMIN_TOKEN=your_token_here && node scripts/add-price-field.js");
    process.exit(1);
  }

  try {
    // 1. Создаём поле price_per_player
    console.log("📦 Добавляем поле 'price_per_player' в коллекцию 'games'...");
    
    const fieldRes = await fetch(`${DIRECTUS_URL}/fields/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        field: "price_per_player",
        type: "integer",
        meta: {
          interface: "input",
          special: null,
          required: false,
          note: "Цена за одного игрока в тенге (₸)"
        },
        schema: {
          name: "price_per_player",
          table: "games",
          data_type: "integer",
          is_nullable: true
        }
      })
    });

    if (!fieldRes.ok) {
      const error = await fieldRes.text();
      // Поле может уже существовать
      if (error.includes("already exists")) {
        console.log("ℹ️ Поле 'price_per_player' уже существует");
      } else {
        console.error("❌ Ошибка создания поля:", error);
        process.exit(1);
      }
    } else {
      console.log("✅ Поле 'price_per_player' создано!");
    }

    // 2. Проверяем что поле доступно
    const checkRes = await fetch(`${DIRECTUS_URL}/items/games?fields=id,name,price_per_player&limit=1`, {
      headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
    });

    if (checkRes.ok) {
      console.log("✅ Поле доступно для чтения!");
      console.log("📋 Теперь доступен авто-расчет цены: игроки × цена_за_человека");
    } else {
      console.warn("⚠️ Поле создано, но нужно настроить права доступа вручную");
    }

    // 3. Обновляем права доступа для branch-admin роли
    console.log("\n🔐 Настраиваем права доступа для branch-admin...");
    
    // Получаем ID роли branch-admin
    const rolesRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=branch-admin&fields=id`, {
      headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json();
      const roleId = rolesData.data?.[0]?.id;
      
      if (roleId) {
        // Обновляем или создаём разрешение на чтение/изменение поля
        const permRes = await fetch(`${DIRECTUS_URL}/permissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ADMIN_TOKEN}`
          },
          body: JSON.stringify({
            role: roleId,
            collection: "games",
            action: "read",
            fields: ["*"]
          })
        });
        
        if (permRes.ok || permRes.status === 409) {
          console.log("✅ Права на чтение настроены");
        }
      }
    }

    console.log("\n🎉 Готово! Поле price_per_player настроено");
    console.log("💡 Теперь в модалке создания записи будет автоматический расчет цены");

  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    process.exit(1);
  }
}

createField();
