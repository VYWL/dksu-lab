const puppeteer = require('puppeteer');
const { qs } = require('./index.js');

const MAIN_URL = 'https://learning.hanyang.ac.kr/';
const TARGET_URL_1 = 'https://learning.hanyang.ac.kr/courses/119029/assignments/1863346';
const TARGET_URL_2 = 'https://learning.hanyang.ac.kr/courses/119029/assignments/1866438';
const TARGET_URL_3 = 'https://learning.hanyang.ac.kr/courses/119029/assignments/1866441';

const TARGET_URL_4 = 'https://hycms.hanyang.ac.kr/em/63f430264bbff';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(MAIN_URL);

    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    await page.waitForSelector('#uid');

    await page.evaluate(() => {
        function qs(selector, parent = document) {
            if (typeof selector !== 'string') {
                throw new TypeError('선택자는 문자열이어야 합니다.');
            }

            if (!(parent instanceof Node)) {
                throw new TypeError('부모 노드는 Node 객체여야 합니다.');
            }

            return parent.querySelector(selector);
        }
        console.log(qs);

        qs('#uid').value = 'dksu40';
        qs('#upw').value = 'shadow2005';
    });

    await page.click('#login_btn');

    // 메인페이지
    await page.waitForSelector('#DashboardCard_Container');

    await page.goto(TARGET_URL_4);

    await page.waitForSelector(
        '#front-screen > div > div.vc-front-screen-btn-container > div.vc-front-screen-btn-wrapper.video1-btn > div'
    );

    const version = await browser.version();

    console.log(`현재 사용 중인 브라우저 버전: ${version}`);

    await page.waitForTimeout(1000);

    await page.click(
        '#front-screen > div > div.vc-front-screen-btn-container > div.vc-front-screen-btn-wrapper.video1-btn > div'
    );

    // await page.waitForSelector('#tool_form');

    // const targetData = await page.evaluate(() => {
    //     return document.querySelector('#tool_form').attributes[0].textContent;
    // });

    // console.log(targetData);

    await page.waitForTimeout(1000000);

    await browser.close();
})();
