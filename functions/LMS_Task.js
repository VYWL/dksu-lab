const { qs, usePageRequest, usePageXHR, extractInfo, saveFileAsJSON, browseJSON } = require('../index.js');
const MAIN_URL = 'https://learning.hanyang.ac.kr/';

const getLoginSession = async (page, info) => {
    const { user_id, user_pw } = info;

    await page.goto(MAIN_URL);

    await page.waitForSelector('#uid');

    await page.evaluate(
        ({ user_id, user_pw }) => {
            function qs(selector, parent = document) {
                if (typeof selector !== 'string') {
                    throw new TypeError('선택자는 문자열이어야 합니다.');
                }

                if (!(parent instanceof Node)) {
                    throw new TypeError('부모 노드는 Node 객체여야 합니다.');
                }

                return parent.querySelector(selector);
            }

            qs('#uid').value = user_id;
            qs('#upw').value = user_pw;
        },
        { user_id, user_pw }
    );

    // 로그인 완료
    await page.click('#login_btn');
    await page.waitForNavigation();

    return page;
};

const browseCourseList = async page => {
    const listReqURL =
        'https://learning.hanyang.ac.kr/api/v1/users/self/favorites/courses?include[]=term&exclude[]=enrollments&sort=nickname';

    const response = await usePageRequest({
        page,
        url: listReqURL,
        useCookie: false,
    });

    const prefix = 'while(1);';
    const cleanText = response.replace(prefix, '');
    const courseList = JSON.parse(cleanText);

    saveFileAsJSON('./courses.json', courseList);

    return courseList;
};

/**
 * 학습 관련 작업을 수행하는 함수.
 * @param {Object} page - Puppeteer 페이지 객체.
 * @param {Object[]} courseList - 학습과목 정보를 담고 있는 객체의 배열.
 */
const browseCourseTasks = async (page, courseList) => {
    const totalTaskList = [];

    for (const { id: courseNum, name: courseName } of courseList) {
        await page.goto(`${MAIN_URL}/courses/${courseNum}/external_tools/1`);
        await page.waitForTimeout(2000);

        /**
         * 학습과목의 작업 정보를 가져오는 함수.
         * @param {Object} page - Puppeteer 페이지 객체.
         * @param {number} courseNum - 학습과목 번호.
         */
        async function getTaskList(page, courseNum) {
            const courseReqURL = `https://learning.hanyang.ac.kr/learningx/api/v1/courses/${courseNum}/allcomponents_db?user_id=${process.env.LMS_USER_ID}&user_login=${process.env.LMS_USER_SID}&role=1`;

            // XHR 요청을 보내고 응답 데이터를 가져오는 함수
            const courseResponse = await usePageXHR({
                page,
                url: courseReqURL,
                useCookie: true,
            });

            return JSON.parse(courseResponse);
        }

        const taskList = extractInfo(await getTaskList(page, courseNum));

        totalTaskList.push({ courseName, taskList });
    }

    // 작업 정보를 JSON 파일로 저장
    saveFileAsJSON('./totalTaskList.json', totalTaskList);

    return totalTaskList;
};

module.exports = {
    getLoginSession,
    browseCourseList,
    browseCourseTasks,
};
