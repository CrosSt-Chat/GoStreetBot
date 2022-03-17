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
            userData.welcome = arg;
            log(`欢迎消息已设为：${arg}`, true);
        }
        else {
            userData.welcome = '';
            TelegramClient.syncMessage({
                nick: 'GoStreetBot',
                trip: 'command',
                text: strings[LANGUAGE]["autoWelcome"]
            }).catch();
        }
        saveBotData();
    }

    static bye(arg) {
        if (arg) {
            userData.bye = arg;
            log(`拜拜消息已设为：${arg}`, true);
        }
        else {
            userData.bye = '';
            TelegramClient.syncMessage({
                nick: 'GoStreetBot',
                trip: 'command',
                text: strings[LANGUAGE]["autoBye"]
            }).catch();
        }
        saveBotData();
    }
}