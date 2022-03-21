import { CrosstClient } from "./crosst.js";
import { LANGUAGE } from "../../index.js";
import strings from "../strings.js";
import { log, saveBotData, userData } from "./utils.js";
import { TelegramClient } from "./telegram.js";

// 与十字街相关的命令
export class CrosstCommands {
    // 帮助信息
    static help() {
        CrosstClient.sendMessageText(strings[LANGUAGE]["help"]);
    }
}

// 与 Telegram 相关的命令
export class TelegramCommands {
    // 成员加入自动欢迎
    // 如果参数为空，则清除当前设置；反之，设置自动欢迎消息
    static welcome(arg) {
        if (arg) {
            userData.welcome = arg.split('&&');
            log(`欢迎消息已设为：${arg}`, true);
        }
        else {
            TelegramClient.syncMessage({
                nick: 'GoStreetBot',
                trip: 'command',
                text: strings[LANGUAGE]["autoWelcome"].replace('{old}', userData.welcome ? userData.welcome.join('&&') : 'None')
            }).catch();
            userData.welcome = [];
            log(`欢迎消息已关闭`);
        }
        saveBotData();
    }

    // 成员退出自动欢送，逻辑同上
    static bye(arg) {
        if (arg) {
            userData.bye = arg.split('&&');
            log(`拜拜消息已设为：${arg}`, true);
        }
        else {
            TelegramClient.syncMessage({
                nick: 'GoStreetBot',
                trip: 'command',
                text: strings[LANGUAGE]["autoBye"].replace('{old}', userData.bye ? userData.bye.join('&&') : 'None')
            }).catch();
            userData.bye = [];
            log(`欢送消息已关闭`);
        }
        saveBotData();
    }
}