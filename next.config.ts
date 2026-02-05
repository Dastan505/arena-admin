// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode включён для лучшей отладки и выявления проблем
  reactStrictMode: true,
  // Опционально: упрощённый деплой и меньший размер (создаёт .next/standalone)
  output: "standalone",
  // Убираем лишний заголовок X-Powered-By
  poweredByHeader: false,
  // Добавляем заголовки безопасности
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
