export class Markdown {
    // Modified from https://github.com/woai3c/2017ife-task/blob/master/hard/markdown/index.js
    // 将 Markdown 转换为 HTML
    static toHTML(str) {
        let title;
        let url;
        let i, len;
        // 将 <> 转换为 &lt; &gt; 防止报错
        str = str.replace(/<+/g, '&lt;').replace(/>+/g, '&gt;');
        // 先处理加粗格式
        let bold = str.match(/\*{2}[^*].*?\*{2}/g); // 惰性匹配
        if (bold) {
            for (i = 0, len = bold.length; i < len; i++) {
                str = str.replace(bold[i], '<b>' + bold[i].substring(2, bold[i].length - 2) + '</b>');
            }
        }

        // 处理斜体格式
        let italic = str.match(/[*][^*].*?[*]/g);
        if (italic) {
            for (i = 0, len = italic.length; i < len; i++) {
                str = str.replace(italic[i], '<i>' + italic[i].substring(1, italic[i].length - 1) + '</i>');
            }
        }

        // 处理删除线格式
        let strikethrough = str.match(/~~[^*].*?~~/g);
        if (strikethrough) {
            for (i = 0, len = strikethrough.length; i < len; i++) {
                str = str.replace(strikethrough[i], '<s>' + strikethrough[i].substring(2, strikethrough[i].length - 2) + '</s>');
            }
        }

        // 处理等宽代码格式
        let code = str.match(/[`][^`].*?[`]/g);
        if (code) {
            for (i = 0, len = code.length; i < len; i++) {
                str = str.replace(code[i], '<code>' + code[i].substring(1, code[i].length - 1) + '</code>');
            }
        }

        // 超链接中的链接地址
        const re1 = /\(.*\)/;
        // 超链接的链接文字
        const re2 = /\[.*]/;

        // 匹配超链接和图片
        let a = str.match(/!?\[[^\[].*?]\([^()].*?\)/g);
        if (a) {
            for (i = 0, len = a.length; i < len; i++) {
                // 把文字和地址单独提取
                url = a[i].match(re1)[0];
                title = a[i].match(re2)[0];
                // 图片有时候不会有文字，所以需要单独判断
                if (title === '[]')
                    title = '[image]';
                else
                    title = title.substring(1, title.length - 1);
                str = str.replace(a[i], '<a href="' + url.substring(1, url.length - 1) + '">' + title + '</a>');
            }
        }
        return str;
    }

    /**
     * 将 Telegram 的 text entities 转换为 Markdown
     * @param text 文本
     * @param entities 格式实体，一般包含 type, offset, length
     * @return {*}
     */
    static from(text, entities) {
        for (let i = 0; i < entities.length; i++) {
            // 将文字分割为三部分，中间部分为待转换的
            let part1 = text.slice(0, entities[i].offset);
            let part2 = text.slice(entities[i].offset, entities[i].offset + entities[i].length);
            let part3 = text.slice(entities[i].offset + entities[i].length);
            // 每处理完一次格式，因为插入了新的字符，所有的 offset 都不再适用，所以需要偏移相应的长度
            let addLength;
            switch (entities[i].type) {
                case 'text_link':
                    text = `${part1}[${part2}](${entities[i].url})${part3}`;
                    addLength = entities[i].url.length + 4;
                    break;
                case 'bold':
                    text = `${part1}**${part2}**${part3}`;
                    addLength = 4;
                    break;
                case 'italic':
                    text = `${part1}*${part2}*${part3}`;
                    addLength = 2;
                    break;
                case 'strikethrough':
                    text = `${part1}~~${part2}~~${part3}`;
                    addLength = 4;
                    break;
                case 'underline':
                    text = `${part1}__${part2}__${part3}`;
                    addLength = 4;
                    break;
                case 'code':
                    if (part2.includes('\n')) {
                        text = part1 + '```\n' + part2 + '\n```' + part3;
                        addLength = 8;
                    } else {
                        text = `${part1}\`${part2}\`${part3}`;
                        addLength = 2;
                    }
                    break;
                default:
                    break;
            }
            // 偏移 offset
            for (let j = i; j < entities.length; j++) {
                entities[j].offset += addLength;
            }
        }
        return text;
    }
}
