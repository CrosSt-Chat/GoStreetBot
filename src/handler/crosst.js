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
                if (userData.welcome) {
                    let welcome = userData.welcome[Math.floor(Math.random() * userData.welcome.length)];
                    CrosstClient.sendMessageText(welcome.replace(/%n/g, nick));
                }
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["joined"].replace('{n}', nick), trip: 'info' });
                break;
            case 'onlineRemove':
                if (userData.bye) {
                    let bye = userData.bye[Math.floor(Math.random() * userData.bye.length)];
                    CrosstClient.sendMessageText(bye.replace(/%n/g, nick));
                }
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
        let { text, photo, caption, entities, reply_to_message } = msg, replyText = '', sender = '';
        if (reply_to_message) {
            replyText = reply_to_message.text || reply_to_message.caption || '';
            if (reply_to_message.from.username === BOT_NAME) {
                sender = '@' + reply_to_message.text.split(' ')[0] + ' ';
                replyText = replyText.slice(replyText.indexOf('\n') + 1);
            }
            if (reply_to_message.photo)
                replyText = '[图片]\n' + replyText;
        }
        if (text) {
            // 先格式化文本
            if (entities) {
                text = Markdown.from(text, msg.entities);
            }
            // 将被回复文本放入消息中
            if (replyText) {
                let lines = replyText.split('\n');
                replyText = '';
                for (let line of lines) {
                    replyText += '> ' + line + '\n';
                }
                replyText += `\n${sender}`;
            }
            text = `${replyText}${text}`;
            this.sendMessageText(text);
        }
        else if (photo) {
            let photo = msg.photo, fileId = photo[photo.length - 1].file_id;
            await downloadPhoto(fileId, Markdown.from(caption, entities || []));
        }
    }
}
