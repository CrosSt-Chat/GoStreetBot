import { CrosstClient } from "./crosst.js";
import { LANGUAGE } from "../../index.js";
import strings from "../strings.js";

export class CrosstCommands {
    static help() {
        CrosstClient.sendMessageText(strings[LANGUAGE].help);
    }
}

export class TelegramCommands {

}