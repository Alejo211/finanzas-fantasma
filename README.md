# Finanzas Fantasma

Simulador web de inversiones en crypto con precios en tiempo real, análisis de sentimiento y alertas.

## Stack
- **Backend**: Next.js 14 (custom server) + WebSockets + Prisma + PostgreSQL
- **Frontend**: React 18 + Vite + TailwindCSS + Recharts + Zustand

## Setup

### 1. Base de datos (Docker — solo el plus)
```bash
docker compose up -d
```
Eso levanta solo el Postgres en `localhost:5432`.

### 2. Variables de entorno
```bash
cp .env.example .env
# Edita con tu NEWS_API_KEY y opcional DISCORD_WEBHOOK_URL
```

### 3. Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
# corre en http://localhost:3001
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
# corre en http://localhost:5173
```

## Claves

| Variable | Dónde |
|---|---|
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) — plan gratuito |
| `DISCORD_WEBHOOK_URL` | Discord → Configuración canal → Integraciones → Webhooks (opcional) |

## Funcionalidades
- Precios en tiempo real desde Binance WebSocket
-  Simulador con wallet virtual de $10,000
-  Compra/venta de BTC, ETH, SOL, BNB, ADA, DOT
-  Portafolio con P&L en vivo
-  Historial de operaciones
-  Análisis de sentimiento desde NewsAPI (cron cada 15 min)
-  Alertas de precio + sentimiento con notificaciones del navegador
-  Discord opcional para alertas externas
