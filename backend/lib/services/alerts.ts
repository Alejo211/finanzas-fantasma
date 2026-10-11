import { prisma } from "../prisma";
import { sendDiscordAlert } from "./notifications";
import { sendToUser } from "../ws-server";
import type { PriceTick } from "./prices";

export async function checkAlerts(tick: PriceTick) {
  const alerts = await prisma.alert.findMany({ where: { symbol: tick.symbol, active: true } });

  for (const alert of alerts) {
    let triggered = false;
    let message = "";

    switch (alert.condition) {
      case "PRICE_ABOVE":
        triggered = tick.price > alert.threshold;
        message = `🚀 **${tick.symbol}** superó $${alert.threshold.toLocaleString()} → actual: $${tick.price.toLocaleString()}`;
        break;
      case "PRICE_BELOW":
        triggered = tick.price < alert.threshold;
        message = `📉 **${tick.symbol}** bajó de $${alert.threshold.toLocaleString()} → actual: $${tick.price.toLocaleString()}`;
        break;
      case "CHANGE_PERCENT_UP":
        triggered = tick.changePercent24h >= alert.threshold;
        message = `📈 **${tick.symbol}** +${tick.changePercent24h.toFixed(2)}% en 24h`;
        break;
      case "CHANGE_PERCENT_DOWN":
        triggered = tick.changePercent24h <= -alert.threshold;
        message = `⚠️ **${tick.symbol}** ${tick.changePercent24h.toFixed(2)}% en 24h`;
        break;
    }

    if (!triggered) continue;

    const cooldown = !alert.triggeredAt ||
      Date.now() - new Date(alert.triggeredAt).getTime() > 30 * 60 * 1000;
    if (!cooldown) continue;

    await prisma.alert.update({ where: { id: alert.id }, data: { triggeredAt: new Date() } });

    sendToUser(alert.userId, {
      type: "alert_triggered",
      data: { alertId: alert.id, symbol: tick.symbol, message, timestamp: new Date().toISOString() },
    });

    await sendDiscordAlert(message);
  }
}
