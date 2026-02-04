// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Отключаем strict mode для dev, если есть проблемы с FullCalendar
  reactStrictMode: false,
  // Опционально: упрощённый деплой и меньший размер (создаёт .next/standalone)
  output: "standalone",
  // Убираем лишний заголовок X-Powered-By
  poweredByHeader: false,
};

export default nextConfig;
