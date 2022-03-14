import { BOT_NAME, CROSST_NICK, CrosstWs, LANGUAGE } from "../../index.js";
import { log, saveBotData } from "./utils.js";
import { TelegramClient } from "./telegram.js";
import { CrosstCommands } from "./command.js";
import strings from "../strings.js";

export async function handleCMessage(message) {
    let data = JSON.parse(message.data);
    let { nick, text } = data;
    switch (data.cmd) {
        case 'chat':
            if (nick === CROSST_NICK)
                break;
            if (text.startsWith('!')) {
                text = text.slice(1);
                let [command, arg] = text.split(' ');
                if (CrosstCommands.hasOwnProperty(command))
                    CrosstCommands[command](arg);
            }
            await TelegramClient.syncMessage(data);
            break;
        case 'onlineAdd':
            await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE].joined.replace('{n}', nick), trip: '*' });
            break;
        case 'onlineRemove':
            await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE].left.replace('{n}', nick), trip: '*' });
            break;
        case 'info':
            await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE].info + text, trip: '*' });
            break;
        case 'onlineSet':
            let { nicks } = data;
            if (nicks.length)
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE].onlineList.replace('{1}', nicks.length).replace('{2}', nicks.join(', ')), trip: '*' });
            else
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE].noOnline, trip: '*' });
            break;
        default:
            break;
    }
}

export class CrosstClient {
    static joinChannel(channel, nick, password) {
        CrosstWs.send(JSON.stringify({ cmd: 'join', channel: channel, nick: nick, password: password }));
        log(`以昵称 ${nick} 加入聊天室 ${channel}...`);
    }

    static sendMessageText(text) {
        CrosstWs.send(JSON.stringify({ cmd: 'chat', text: text }));
    }

    static sendCommand(data) {
        CrosstWs.send(JSON.stringify(data));
    }

    static syncMessage(msg) {
        let nick = msg.from.first_name + (msg.from.last_name ? ` ${msg.from.last_name}` : '');
        let { text, photo } = msg, replyMsg, replyText = '', sender = '';
        if (msg.reply_to_message) {
            replyMsg = msg.reply_to_message;
            // 来自十字街的消息
            if (replyMsg.from.username === BOT_NAME) {
                // 分割出发送者
                sender = '@' + replyMsg.text.split(' ')[0] + ' ';
                // 根据回复消息类型进行回应
                if (replyMsg.text)
                    replyText = replyMsg.text.slice(replyMsg.text.indexOf('\n') + 1);
                else if (replyMsg.photo) {
                    replyText = `[Unsupported] [图片]`;
                    // Todo: 获取图片、上传图床、回复
                }
            }
            // 来自电报群的消息
            else {
                replyText = replyMsg.from.first_name + (replyMsg.from.last_name ? ` ${replyMsg.from.last_name}` : '') + ': ';
                if (replyMsg.text)
                    replyText += replyMsg.text.slice(replyMsg.text.indexOf('\n') + 1);
                else if (replyMsg.photo) {
                    replyText += `[Unsupported] [图片]`;
                    // Todo: 获取图片、上传图床、回复
                }
            }
        }
        if (text) {
            text = replyText ? `${nick}: \n> ${replyText}\n\n${sender}${text}` : `${nick}: ${text}`;
            this.sendMessageText(text);
        }
        else if (photo) {
            this.sendMessageText(`${nick}: [Unsupported] [图片]`);
            // Todo: 获取图片、上传图床、回复
        }
        saveBotData();
    }
}
