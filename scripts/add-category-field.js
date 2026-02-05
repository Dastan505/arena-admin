// Скрипт для добавления поля category в коллекцию games
// Запуск: node scripts/add-category-field.js

const DIRECTUS_URL = "https://directus.arena-api.ru";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN; // Нужен токен администратора

async function createField() {
  if (!ADMIN_TOKEN) {
    console.error("❌ Установите переменную окружения DIRECTUS_ADMIN_TOKEN");
    console.log("Пример: set DIRECTUS_ADMIN_TOKEN=your_token_here && node scripts/add-category-field.js");
    process.exit(1);
  }

  try {
    // 1. Создаём поле category
    console.log("📦 Добавляем поле 'category' в коллекцию 'games'...");
    
    const fieldRes = await fetch(`${DIRECTUS_URL}/fields/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        field: "category",
        type: "string",
        meta: {
          interface: "input",
          special: null,
          required: false,
          note: "Категория игры (например: Квест игры, Детские игры)"
        },
        schema: {
          name: "category",
          table: "games",
          data_type: "character varying",
          max_length: 255,
          is_nullable: true
        }
      })
    });

    if (!fieldRes.ok) {
      const error = await fieldRes.text();
      console.error("❌ Ошибка создания поля:", error);
      process.exit(1);
    }

    console.log("✅ Поле 'category' создано!");

    // 2. Проверяем что поле доступно
    const checkRes = await fetch(`${DIRECTUS_URL}/items/games?fields=id,name,category&limit=1`, {
      headers: { "Authorization": `Bearer ${ADMIN_TOKEN}` }
    });

    if (checkRes.ok) {
      console.log("✅ Поле доступно для чтения!");
      console.log("📋 Теперь Kimi может вернуть category в API");
    } else {
      console.warn("⚠️ Поле создано, но нужно настроить права доступа вручную");
    }

  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    process.exit(1);
  }
}

createField();
