// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Отключаем strict mode для dev, если есть проблемы с FullCalendar
  reactStrictMode: false,
};

export default nextConfig;