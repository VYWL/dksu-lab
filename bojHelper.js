const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const dotenv = require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

// Get the problem ID and language from the command line arguments
const args = process.argv.slice(2);
const prob_id = parseInt(args[0]);
const lang = args[1];

// Check if the problem ID is a valid integer
if (isNaN(prob_id) || prob_id < 1) {
    console.error('Error: Invalid problem ID.');
    process.exit(1);
}

// Check if the language is a valid string
if (!lang || typeof lang !== 'string') {
    console.error('Error: Invalid language.');
    process.exit(1);
}

const id = prob_id; // 가져올 element의 id 값
const url = `https://noj.am/${id}`;
const headers = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
};

const conf = new Configuration({
    apiKey: process.env.OPENAI_APIKEY,
});

const openai = new OpenAIApi(conf);

axios
    .get(url, { headers })
    .then(async response => {
        const html = response.data;
        const $ = cheerio.load(html);
        const transRule = `다음 질문에 이런 형식으로 알려줘.
1. 문제 분류 : (키워드별로 comma 구분하여 작성)
2. 핵심 포인트 : (3줄 이내로, 문제 포인트 작성)
3. 코드 : (코드를 코드블럭 내에 작성하되, 언어는 ${lang}으로)

---`;
        const refinePtag = p =>
            p
                .map(function () {
                    return $(this).text().trim();
                })
                .get()
                .join('\n');

        const problemDescription = refinePtag($('#problem_description p'));
        const problemInput = `Input:\n${refinePtag($('#problem_input p'))}`;
        const problemOutput = `Output:\n${refinePtag($('#problem_output p'))}`;

        const totaltxt = [transRule, problemDescription, problemInput, problemOutput].join('\n');

        const resp = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: totaltxt }],
        });
        const respMessage = resp.data.choices[0].message.content.trim();

        const codeRegex = /```([^\n]+)?\n?([\s\S]*?)\n?```/gi;
        const codeMatches = respMessage.matchAll(codeRegex);

        // create an array of code block contents
        const codeContents = [];
        for (const match of codeMatches) {
            let codeContent = match[2];
            if (match[1]) {
                // remove the language value from the code content
                codeContent = codeContent.replace(new RegExp(`^${match[1]}\n?`), '');
            }
            codeContents.push(codeContent);
        }

        fs.writeFileSync(`${id}_request.txt`, totaltxt, 'utf8');
        fs.writeFileSync(`${id}_response.txt`, respMessage, 'utf8');
        fs.writeFileSync(`${id}_code.txt`, codeContents.join('\n'), 'utf8');
    })
    .catch(error => {
        console.log(error);
    });
