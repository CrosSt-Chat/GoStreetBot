import * as fs from 'fs';
import { ADMIN_ID, bot, BOT_TOKEN, LANGUAGE, SMMS_TOKEN } from "../../index.js";
import strings from "../strings.js";
import * as path from "path";
import request from 'request';
import { CrosstClient } from "./crosst.js";
import webp from 'webp-converter';

export let userData = { welcome: [], bye: [] };
let rateList = {};
webp.grant_permission();

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

// 加载机器人的数据
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
    // 统计语言包数量
    let keys = Object.keys(strings);
    log(`加载了 ${keys.length} 个语言包文件（${keys}）`);
}

// 保存机器人数据
export function saveBotData() {
    function save(name, data) {
        fs.writeFileSync(`./data/${name}.json`, JSON.stringify(data));
    }

    if (!fs.existsSync('./data'))
        fs.mkdirSync('./data');

    save('userData', userData);
}

/**
 * 从 Telegram 下载图片至本地
 * @param file_id 图片的 ID
 * @param caption 说明文字
 * @return {Promise<void>}
 */
export async function downloadPhoto(file_id, caption) {
    // 此功能需要用户提供 sm.ms 的用户令牌
    if (SMMS_TOKEN) {
        let editMsg = await bot.telegram.sendMessage(ADMIN_ID, strings[LANGUAGE]["downloading"]).catch(() => { });
        let editMsgId = editMsg.message_id ? editMsg.message_id : null;
        // 向 Telegram 服务端请求文件下载链接
        let result = await bot.telegram.getFile(file_id);
        let filePath = result.file_path;
        // 本地将要存储的文件地址
        let realFilePath = `./temp/${path.basename(filePath)}`;
        // 下载链接
        let url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        try {
            if (!fs.existsSync('./temp'))
                fs.mkdirSync('./temp');
            // 创建写入流
            let file = fs.createWriteStream(realFilePath);
            // 下载图片
            request(url).pipe(file).on('close', async () => {
                log(`下载完成：${realFilePath}`);
                file.close();
                // 如果是贴纸，则尝试转换
                if (filePath.endsWith('.webp')) {
                    let newFilePath = realFilePath.replace('.webp', '.jpg');
                    try {
                        await webp.dwebp(realFilePath, newFilePath, '-o');
                        fs.rmSync(realFilePath);
                        await uploadPhoto(newFilePath, caption, editMsgId);
                    }
                    catch (e) {
                        log(`webp 转换失败：${e.stack}`, true);
                    }
                }
                else {
                    // 进入上传部分
                    await uploadPhoto(realFilePath, caption, editMsgId);
                }
            });
        } catch (e) {
            log(`传输图片时出错：${e.message}`, true);
        }
    }
    else {
        log(`请在 .env 中配置 SMMS_TOKEN`, true);
    }
}

/**
 * 将本地图片上传至 sm.ms
 * @param filePath
 * @param caption
 * @param editMsgId
 */
async function uploadPhoto(filePath, caption, editMsgId) {
    if (editMsgId) {
        try {
            await bot.telegram.editMessageText(ADMIN_ID, editMsgId, null, strings[LANGUAGE]["uploading"]);
        }
        catch (e) {
            if (e.message.includes('not found')) {
                await bot.telegram.sendMessage(ADMIN_ID, strings[LANGUAGE]["uploading"]);
            }
        }
    }
    // POST 选项
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

    // 提交表单
    request.post(options, (err, res) => {
        if (err)
            log(`上传图片时出错：${err.message}`, true);
        else {
            // 处理返回结果
            let data = JSON.parse(res.body);
            let url = '';
            // 图片先前未上传过，服务端返回 success
            if (data.success)
                url = data.data.url;
            // 如果图片已经存在于 sm.ms，服务端不会返回 success，但是仍然包含图片链接
            else if (data.images)
                url = data.images;
            // 如果 url 不为空（即上传成功）
            if (url) {
                let text = `![Uploaded by GoStreetBot](${url})`;
                if (caption)
                    text += `\n\n${caption}`;
                CrosstClient.sendMessageText(text);
                log('上传完成！');
            }
            else
                log(`上传图片时出错：${data.message}`, true);
        }
        fs.rmSync(filePath);
        bot.telegram.deleteMessage(ADMIN_ID, editMsgId).catch(() => { });
    }, 'utf8');
}

export class FrequencyLimiter {
    static exceeds(nick) {
        return rateList[nick] ? rateList[nick] >= 3 : false;
    }

    static add(nick) {
        if (!rateList[nick])
            rateList[nick] = 1;
        else
            rateList[nick]++;
        setTimeout(() => {
            rateList[nick]--;
        }, 60000);
    }

    static warn(nick) {
        CrosstClient.sendMessageText(`@${nick} ${strings[LANGUAGE]["rateLimit"]}`);
        CrosstClient.ban(nick);
        log(`${nick} 加入过于频繁，已封禁 3 分钟`);
    }

    static clear(nick) {
        delete rateList[nick];
    }
}
