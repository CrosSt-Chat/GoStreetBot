import * as fs from 'fs';
import { bot, ADMIN_ID } from "../../index.js";
import strings from "../strings.js";

let userData = {};

/**
 * console.log wrapper，加上时间
 * @param {string} text
 * @param {boolean} alert 是否通知管理员
 * @returns {void}
 */
export function log(text, alert = false) {
    console.log(new Date().toLocaleString('zh-CN') + ': ' + text);
    if (alert)
        bot.telegram.sendMessage(ADMIN_ID, text).catch(() => {
        });
}

export function loadBotData() {
    function load(name) {
        log(`加载 ${name}`);
        if (fs.existsSync(`./data/${name}.json`)) {
            return JSON.parse(fs.readFileSync(`./data/${name}.json`, 'utf8'));
        }
        return {};
    }

    log('加载数据...');
    if (!fs.existsSync('./data'))
        fs.mkdirSync('./data');
    userData = load('userData');
    let keys = Object.keys(strings);
    log(`加载了 ${keys.length} 个语言包文件（${keys}）`);
}

export function saveBotData() {
    function save(name, data) {
        fs.writeFileSync(`./data/${name}.json`, JSON.stringify(data));
    }
    if (!fs.existsSync('./data'))
        fs.mkdirSync('./data');
    save('userData', userData);
}

export function checkData(data) {
    let { nick, trip, tid } = data;
    if (!userData[trip])
        userData[trip] = { nick: nick, tid: null };
    else if (tid)
        userData[trip].tid = tid;
}