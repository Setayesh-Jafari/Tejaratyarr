# ─────────────────────────────────────────────────────────────
# تجارت‌یار — Dockerfile برای استقرار روی Liara / ArvanCloud / هر هاست کانتینری
# خروجی build (dist/server.cjs) کاملاً خودکفاست؛ مرحله‌ی runtime نیازی به node_modules ندارد.
# ─────────────────────────────────────────────────────────────

# ── مرحله‌ی build ──
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ── مرحله‌ی runtime ──
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# فقط خروجی build کپی می‌شود (سرور باندل‌شده + استاتیک کلاینت)
COPY --from=build /app/dist ./dist
# پورت از متغیر محیطی PORT خوانده می‌شود (Liara/Arvan خودش مقدار می‌دهد)؛ پیش‌فرض 3000
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
