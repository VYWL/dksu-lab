const puppeteer = require('puppeteer-core');

const browserInit = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    return { browser, page };
};

module.exports = {
    browserInit,
};
