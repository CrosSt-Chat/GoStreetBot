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
                text: strings[LANGUAGE]["autoWelcome"].replace('{old}', userData.welcome.join('&&')),
            }).catch();
            userData.welcome = null;
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
                text: strings[LANGUAGE]["autoBye"].replace('{old}', userData.bye.join('&&'))
            }).catch();
            userData.bye = null;
        }
        saveBotData();
    }
}