import { ADMIN_ID, bot } from "../../index.js";
import { log } from "./utils.js";
import { CrosstClient } from "./crosst.js";
import { TelegramCommands } from "./command.js";
import { Markdown } from "./format.js";

export class TelegramClient {
    static async handleMessage(ctx) {
        let msg = ctx.message;
        let { text } = msg;
        let user = msg.from.id.toString();
        if (user === ADMIN_ID) {
            let executed = false;
            if (text && text.startsWith('/')) {
                let command = text.split(' ')[0].slice(1);
                if (TelegramCommands.hasOwnProperty(command)) {
                    executed = true;
                    let arg = text.slice(command.length + 2);
                    TelegramCommands[command](arg);
                }
            }
            if (!executed)
                await CrosstClient.syncMessage(msg);
        }
    }

    static async syncMessage(data) {
        let { nick, text, trip } = data;
        text = Markdown.toHTML(`${nick} [${trip}]:\n${text}`);
        try {
            await bot.telegram.sendMessage(ADMIN_ID, text, { parse_mode: 'HTML' });
        }
        catch (e) {
            log(`向 Telegram 同步消息时出错：${e.message}`, true);
        }
    }
}