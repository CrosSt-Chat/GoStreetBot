import { BOT_NAME, CrosstWs, LANGUAGE } from "../../index.js";
import { log, downloadPhoto, userData } from "./utils.js";
import { TelegramClient } from "./telegram.js";
import { CrosstCommands } from "./command.js";
import strings from "../strings.js";
import { Markdown } from "./format.js";

export class CrosstClient {
    static async handleMessage(message) {
        let data = JSON.parse(message.data);
        let { nick, text } = data;
        switch (data.cmd) {
            case 'chat':
                if (text.startsWith('!')) {
                    text = text.slice(1);
                    let [command, arg] = text.split(' ');
                    if (CrosstCommands.hasOwnProperty(command))
                        CrosstCommands[command](arg);
                }
                await TelegramClient.syncMessage(data);
                break;
            case 'onlineAdd':
                if (userData.welcome)
                    CrosstClient.sendMessageText(userData.welcome.replace(/%n/g, nick));
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["joined"].replace('{n}', nick), trip: 'info' });
                break;
            case 'onlineRemove':
                if (userData.bye)
                    CrosstClient.sendMessageText(userData.bye.replace(/%n/g, nick));
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["left"].replace('{n}', nick), trip: 'info' });
                break;
            case 'info':
                await TelegramClient.syncMessage({ nick: 'System', text: text, trip: 'info' }, true);
                break;
            case 'warn':
                 await TelegramClient.syncMessage({ nick: 'System', text: text, trip: 'warn' }, true);
                 break;
            case 'onlineSet':
                let { nicks } = data;
                if (nicks.length)
                    await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["onlineList"].replace('{1}', nicks.length).replace('{2}', nicks.join(', ')), trip: 'info' });
                else
                    await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["noOnline"], trip: 'info' });
                break;
            default:
                await TelegramClient.syncMessage({ nick: 'System', text: text, trip: 'unsupported' });
                break;
        }
    }

    static joinChannel(channel, nick, password) {
        CrosstWs.send(JSON.stringify({ cmd: 'join', channel: channel, nick: nick, password: password }));
        log(`以昵称 ${nick} 加入聊天室 ${channel}...`);
    }

    static sendMessageText(text) {
        CrosstWs.send(JSON.stringify({ cmd: 'chat', text: text }));
    }

    static async syncMessage(msg) {
        let { text, photo, caption, entities } = msg, replyMsg, replyText = '', sender = '';
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
                    await downloadPhoto(replyMsg.photo[0].file_id, Markdown.from(caption, entities || []));
                }
            }
            // 来自电报群的消息
            else {
                if (replyMsg.text)
                    replyText += replyMsg.text.slice(replyMsg.text.indexOf('\n') + 1);
                else if (replyMsg.photo) {
                    await downloadPhoto(replyMsg.photo[0].file_id, Markdown.from(caption, entities || []));
                }
            }
        }
        if (text) {
            if (entities) {
                text = Markdown.from(text, msg.entities);
            }
            text = replyText ? `> ${replyText}\n\n${sender}${text}` : text;
            this.sendMessageText(text);
        }
        else if (photo) {
            let photo = msg.photo, fileId = photo[photo.length - 1].file_id;
            await downloadPhoto(fileId, Markdown.from(caption, entities || []));
        }
    }
}
