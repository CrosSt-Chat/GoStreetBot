export class Markdown {
    // Modified from https://github.com/woai3c/2017ife-task/blob/master/hard/markdown/index.js
    static toHTML(str) {
        let title;
        let url;
        let i, len;
        str = str.replace(/<+/g, '&lt;').replace(/>+/g, '&gt;');
        let bold = str.match(/\*{2}[^*].*?\*{2}/g); // 惰性匹配
        if (bold) {
            for (i = 0, len = bold.length; i < len; i++) {
                str = str.replace(bold[i], '<b>' + bold[i].substring(2, bold[i].length - 2) + '</b>');
            }
        }

        let italic = str.match(/[*][^*].*?[*]/g);
        if (italic) {
            for (i = 0, len = italic.length; i < len; i++) {
                str = str.replace(italic[i], '<i>' + italic[i].substring(1, italic[i].length - 1) + '</i>');
            }
        }

        let strikethrough = str.match(/~~[^*].*?~~/g);
        if (strikethrough) {
            for (i = 0, len = strikethrough.length; i < len; i++) {
                str = str.replace(strikethrough[i], '<s>' + strikethrough[i].substring(2, strikethrough[i].length - 2) + '</s>');
            }
        }

        let code = str.match(/[`][^`].*?[`]/g);
        if (code) {
            for (i = 0, len = code.length; i < len; i++) {
                str = str.replace(code[i], '<code>' + code[i].substring(1, code[i].length - 1) + '</code>');
            }
        }

        const re1 = /\(.*\)/;
        const re2 = /\[.*]/;

        let a = str.match(/!?\[[^\[].*?]\([^()].*?\)/g);
        if (a) {
            for (i = 0, len = a.length; i < len; i++) {
                url = a[i].match(re1)[0];
                title = a[i].match(re2)[0];
                if (title === '[]')
                    title = '[image]';
                else
                    title = title.substring(1, title.length - 1);
                str = str.replace(a[i], '<a href="' + url.substring(1, url.length - 1) + '">' + title + '</a>');
            }
        }
        return str;
    }

    // This parsing method may be buggy in extreme cases
    static from(text, entities) {
        for (let i = 0; i < entities.length; i++) {
            let part1 = text.slice(0, entities[i].offset);
            let part2 = text.slice(entities[i].offset, entities[i].offset + entities[i].length);
            let part3 = text.slice(entities[i].offset + entities[i].length);
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
            for (let j = i; j < entities.length; j++) {
                entities[j].offset += addLength;
            }
        }
        return text;
    }
}
