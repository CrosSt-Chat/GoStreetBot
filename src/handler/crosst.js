import { BOT_NAME, CrosstWs, LANGUAGE } from "../../index.js";
import { log, downloadPhoto, userData } from "./utils.js";
import { TelegramClient } from "./telegram.js";
import { CrosstCommands } from "./command.js";
import strings from "../strings.js";
import { Markdown } from "./format.js";

export class CrosstClient {
    // 处理来自十字街的消息
    static async handleMessage(message) {
        let data = JSON.parse(message.data);
        // nick: 发送者昵称，text: 消息内容
        let { nick, text } = data;
        // 根据 command 判断作何反应
        switch (data.cmd) {
            // 正常聊天
            case 'chat':
                // 此机器人在十字街的命令系统以 ! 开头
                if (text.startsWith('!')) {
                    text = text.slice(1);
                    // 分割命令和参数
                    let [command, arg] = text.split(' ');
                    // 如果命令存在（详见 command.js），则执行命令
                    if (CrosstCommands.hasOwnProperty(command))
                        CrosstCommands[command](arg);
                }
                await TelegramClient.syncMessage(data);
                break;
            // 用户加入频道通知
            case 'onlineAdd':
                // 如果用户设置了加入欢迎，则随机挑选一条进行发送
                if (userData.welcome.length > 0) {
                    let welcome = userData.welcome[Math.floor(Math.random() * userData.welcome.length)];
                    CrosstClient.sendMessageText(welcome.replace(/%n/g, nick));
                }
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["joined"].replace('{n}', nick), trip: 'info' });
                break;
            // 用户离开频道通知
            case 'onlineRemove':
                // 如果用户设置了欢送消息，则随机挑选一条进行发送
                if (userData.bye.length > 0) {
                    let bye = userData.bye[Math.floor(Math.random() * userData.bye.length)];
                    CrosstClient.sendMessageText(bye.replace(/%n/g, nick));
                }
                await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["left"].replace('{n}', nick), trip: 'info' });
                break;
            // 多为系统通知，如当前时间、在线列表等
            case 'info':
                await TelegramClient.syncMessage({ nick: 'System', text: text, trip: 'info' }, true);
                break;
            // 警告信息
            case 'warn':
                await TelegramClient.syncMessage({ nick: 'System', text: text, trip: 'warn' }, true);
                break;
            // 加入频道时的在线用户列表
            case 'onlineSet':
                let { nicks } = data;
                // 如果有人在线，则发送在线列表；否则提示无人在线
                if (nicks.length)
                    await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["onlineList"].replace('{1}', nicks.length).replace('{2}', nicks.join(', ')), trip: 'info' });
                else
                    await TelegramClient.syncMessage({ nick: 'System', text: strings[LANGUAGE]["noOnline"], trip: 'info' });
                break;
            // 其它类型的消息暂不作支持
            default:
                await TelegramClient.syncMessage({ nick: 'System', text: text, trip: 'unsupported' });
                break;
        }
    }

    /**
     * 加入十字街特定频道
     * @param channel 频道名称
     * @param nick 昵称
     * @param password 密码
     */
    static joinChannel(channel, nick, password) {
        CrosstWs.send(JSON.stringify({ cmd: 'join', channel: channel, nick: nick, password: password }));
        log(`以昵称 ${nick} 加入聊天室 ${channel}...`);
    }

    /**
     * 发送聊天消息
     * @param text 聊天内容
     */
    static sendMessageText(text) {
        CrosstWs.send(JSON.stringify({ cmd: 'chat', text: text }));
    }

    /**
     * 向十字街同步来自 Telegram 的消息
     * @param msg Update 的 message
     * @return {Promise<void>}
     */
    static async syncMessage(msg) {
        // 消息有两种类别共四种类型：来自自己和来自他人；纯文本和图片
        let { text, photo, caption, entities, reply_to_message } = msg, replyText = '', sender = '';
        // 如果是回复消息，则进行一下预处理
        if (reply_to_message) {
            // 消息可能是纯文本，也可能是带图片的消息并包含 caption，其它类型不作支持
            replyText = reply_to_message.text || reply_to_message.caption || '';
            // 如果是机器人自己发送的消息（即来自十字街）
            if (reply_to_message.from.username === BOT_NAME) {
                // 将原消息的正文提取出来
                sender = '@' + reply_to_message.text.split(' ')[0] + ' ';
                replyText = replyText.slice(replyText.indexOf('\n') + 1);
            }
            // 如果消息中包含图片，则添加一个标识
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
                // 每行之前加上引用消息的 Markdown 前缀
                let lines = replyText.split('\n');
                replyText = '';
                for (let line of lines) {
                    replyText += '> ' + line + '\n';
                }
                // 最后加上 @发送者（遵循十字街风格）
                replyText += `\n${sender}`;
            }
            text = `${replyText}${text}`;
            // 发送至十字街
            this.sendMessageText(text);
        }
        else if (photo) {
            let photo = msg.photo, fileId = photo[photo.length - 1].file_id;
            // 转交给传输图片的函数处理
            await downloadPhoto(fileId, Markdown.from(caption, entities || []));
        }
    }
}
