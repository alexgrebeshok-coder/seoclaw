import { NextRequest, NextResponse } from "next/server";
import { executeCommand } from "@/lib/command-handler";
import {
  getTelegramToken,
  sendTelegramTextMessage,
} from "@/lib/connectors/telegram-client";

/**
 * Telegram Bot Webhook endpoint
 * 
 * Receives messages from Telegram and responds via Bot API
 * 
 * Setup webhook:
 * curl -F "url=https://your-domain.com/api/telegram/webhook" \
 *   https://api.telegram.org/bot<TOKEN>/setWebhook
 */

const TELEGRAM_BOT_TOKEN = getTelegramToken();

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

/**
 * Send message to Telegram chat
 */
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[Telegram] BOT_TOKEN not configured");
    return;
  }

  try {
    const result = await sendTelegramTextMessage({
      token: TELEGRAM_BOT_TOKEN,
      chatId,
      text,
      parseMode: "Markdown",
    });

    if (!result.ok) {
      console.error("[Telegram] Failed to send message:", result.message);
    }
  } catch (error) {
    console.error("[Telegram] Failed to send message:", error);
  }
}

/**
 * Handle incoming Telegram webhook
 */
export async function POST(request: NextRequest) {
  // Verify Telegram secret token (if configured)
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    const headerToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerToken !== secretToken) {
      console.error("[Telegram Webhook] Invalid secret token");
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  } else {
    console.warn("[Telegram Webhook] TELEGRAM_WEBHOOK_SECRET not configured. Webhook is publicly accessible!");
  }

  try {
    const update: TelegramUpdate = await request.json();

    // Validate update
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text;

    console.log(`[Telegram] Received from ${message.from.first_name}: ${text}`);

    // Execute command via CommandHandler
    const result = await executeCommand(text ?? "");

    // Send response to Telegram
    await sendTelegramMessage(chatId, result.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook verification
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Telegram webhook endpoint ready",
    configured: !!TELEGRAM_BOT_TOKEN,
  });
}
