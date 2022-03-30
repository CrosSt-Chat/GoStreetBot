import * as fs from 'fs';
import { ADMIN_ID, bot, BOT_TOKEN, SMMS_TOKEN } from "../../index.js";
import strings from "../strings.js";
import * as path from "path";
import request from 'request';
import { CrosstClient } from "./crosst.js";

export let userData = { welcome: [], bye: [] };

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
        log(`正在下载图片...`, true);
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
            request(url).pipe(file).on('close', () => {
                log(`下载完成：${realFilePath}`);
                file.close();
                // 进入上传部分
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

/**
 * 将本地图片上传至 sm.ms
 * @param filePath
 * @param caption
 */
export function uploadPhoto(filePath, caption) {
    log(`正在上传至图床...`, true);
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
    }, 'utf8');
}