import { ADMIN_ID, bot } from "../../index.js";
import { log } from "./utils.js";
import { CrosstClient } from "./crosst.js";
import { TelegramCommands } from "./command.js";
import { Markdown } from "./format.js";

export class TelegramClient {
    // 处理 Telegram 机器人端收到的消息
    static async handleMessage(ctx) {
        // Update 的 message 部分
        let msg = ctx.message;
        // message 的文本部分
        let { text } = msg;
        // 用户唯一识别符
        let user = msg.from.id.toString();
        if (user === ADMIN_ID) {
            // 命令是否已执行
            let executed = false;
            // 在 Telegram 中，命令以 / 开头
            if (text && text.startsWith('/')) {
                // 分割命令主体
                let command = text.split(' ')[0].slice(1);
                // 如果内置命令库中有此命令，则执行
                if (TelegramCommands.hasOwnProperty(command)) {
                    executed = true;
                    let arg = text.slice(command.length + 2);
                    TelegramCommands[command](arg);
                }
            }
            // 如果未发现命令，则转发到十字街
            if (!executed)
                await CrosstClient.syncMessage(msg);
        }
    }

    // 向 Telegram 同步消息
    static async syncMessage(data) {
        // nick: 昵称，text: 文本，trip: 识别码
        let { nick, text, trip } = data;
        // 将 Markdown 转换为 HTML
        text = Markdown.toHTML(`${nick} [${trip}]:\n${text}`);
        try {
            await bot.telegram.sendMessage(ADMIN_ID, text, { parse_mode: 'HTML' });
        }
        catch (e) {
            log(`向 Telegram 同步消息时出错：${e.message}`, true);
        }
    }
}