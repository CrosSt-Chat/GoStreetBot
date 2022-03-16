import * as fs from 'fs';
import { ADMIN_ID, bot, BOT_TOKEN, SMMS_TOKEN } from "../../index.js";
import strings from "../strings.js";
import * as path from "path";
import request from 'request';
import { CrosstClient } from "./crosst.js";

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

export async function downloadPhoto(file_id, caption) {
    if (SMMS_TOKEN) {
        log(`正在下载图片...`, true);
        let result = await bot.telegram.getFile(file_id);
        let filePath = result.file_path;
        let realFilePath = `./temp/${path.basename(filePath)}`;
        let url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        try {
            if (!fs.existsSync('./temp'))
                fs.mkdirSync('./temp');
            let file = fs.createWriteStream(realFilePath);
            request(url).pipe(file).on('close', () => {
                log(`下载完成：${realFilePath}`);
                file.close();
                uploadPhoto(realFilePath, caption);
            });
        } catch (e) {
            log(`传输图片时出错：${e.message}`, true);
        }
    }
    else {
        log(`请在 .env 中配置 SMMS_TOKEN`, true);
    }
}

export function uploadPhoto(filePath, caption) {
    log(`正在上传至图床...`, true);
    let options = {
        uri: 'https://sm.ms/api/v2/upload',
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': SMMS_TOKEN
        },
        formData: {
            smfile: fs.createReadStream(filePath),
            type: 'json'
        }
    };

    request.post(options, (err, res) => {
        if (err)
            log(`上传图片时出错：${err.message}`, true);
        else {
            let data = JSON.parse(res.body);
            console.log(data);
            if (data.images) {
                let text = `![Uploaded by GoStreetBot](${data.images})`;
                if (caption)
                    text += `\n\n${caption}`;
                CrosstClient.sendMessageText(text);
                fs.rmSync(filePath);
                log('上传完成！');
            }
            else {
                log(`上传图片时出错：${data.message}`, true);
            }
        }
    }, 'utf8');
}