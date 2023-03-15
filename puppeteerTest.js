const { usePageXHR, saveFileAsJSON } = require('.');
const { browseCourseList, browseCourseTasks, getLoginSession } = require('./functions/LMS_Task');
const { browserInit } = require('./functions/puppeteer');

require('dotenv').config();

(async () => {
    let { browser, page } = await browserInit();
    // 로그인 시도
    page = await getLoginSession(page, {
        user_id: process.env.USER_ID,
        user_pw: process.env.USER_PW,
    });

    // 강의목록
    // 로그인 이후, 곧바로 해당 회원의 Course 리스트를 가져온다.
    const courseList = await browseCourseList(page);

    // 강의 중 과제 목록을 전부 불러와서 저장.
    const totalTaskList = await browseCourseTasks(page, [courseList[0]]);

    // const courseList = browseJSON('./temp/courses.json');

    // 강의 들었는지 Status 확인하는 코드
    const courseNum = courseList[0].id;
    const lecStatusURL = `https://learning.hanyang.ac.kr/learningx/api/v1/courses/${courseNum}/sections/learnstatus_db?user_id=${process.env.LMS_USER_ID}&user_login=${process.env.LMS_USER_SID}&role=1`;
    const response = await usePageXHR({
        page,
        url: lecStatusURL,
        useCookie: true,
    });

    saveFileAsJSON('./temp/lecStatus.json', JSON.parse(response));

    // TODO :: 위에 Status 정리
    // TODO :: 여러 Tab 관리하는거 처리
    /*
   
   const puppeteer = require('puppeteer');

async function handlePage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url);

  // video 태그가 있는 경우
  if (await page.$('video')) {
    // 비디오 재생
    await page.click('#front-screen > div > div.vc-front-screen-btn-container > div.vc-front-screen-btn-wrapper.video1-btn > div');
    await page.waitFor(10000);

    // 비디오 종료 대기
    const duration = await page.$eval('video', video => video.duration);
    await page.waitFor(duration * 1000 + 20000);
    await page.close();
  }
  // video 태그가 없는 경우
  else {
    // 파일 다운로드
    await page.click('#content_download_btn');
    await page.waitForDownload();
    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch();

  // 각 페이지마다 다른 작업을 수행
  await handlePage(browser, 'https://www.example.com');
  await handlePage(browser, 'https://www.example.com/video');
  await handlePage(browser, 'https://www.example.com/download');

  await browser.close();
})();
   
   
   */

    await page.waitForTimeout(10000000);
    await browser.close();
})();
