import { CrosstClient } from "./crosst.js";
import { LANGUAGE } from "../../index.js";
import strings from "../strings.js";
import { log, saveBotData, userData } from "./utils.js";
import { TelegramClient } from "./telegram.js";

export class CrosstCommands {
    static help() {
        CrosstClient.sendMessageText(strings[LANGUAGE]["help"]);
    }
}

export class TelegramCommands {
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