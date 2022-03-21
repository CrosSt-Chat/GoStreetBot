import { readdirSync, readFileSync } from 'fs';

// 读取语言包列表
let i18n = readdirSync('./src/i18n');
let strings = {};
// 装载语言包
for (let lang of i18n) {
    strings[lang.split('.')[0]] = JSON.parse(readFileSync(`./src/i18n/${lang}`, 'utf-8'));
}

export default strings;