const fs = require('fs');

/**
 * 일부만 주어진 Selector에 해당하는 Element들의 Full Selector 값을 반환하는 함수입니다.
 * @param {string} selector - 검색할 Selector를 나타내는 문자열입니다.
 * @returns {Array<string>} - 검색된 Element들의 Full Selector를 담고 있는 문자열 배열입니다.
 */
const getFullSelector = selector => {
    /**
     * 검색 결과로 나온 Element의 Full Selector를 반환하는 내부 함수입니다.
     * @param {Element} element - Full Selector를 구할 Element입니다.
     * @returns {string} - Element의 Full Selector를 나타내는 문자열입니다.
     */
    const getFullSelectorForElement = element => {
        let fullSelector = '';
        let closest = element.closest('*');
        if (closest) {
            const selectors = [];
            while (closest !== document.documentElement && closest !== null) {
                let selector = closest.tagName.toLowerCase();
                if (closest.id) {
                    selector += '#' + closest.id;
                    selectors.unshift(selector);
                    break;
                } else if (closest.className) {
                    const classNames = closest.className.split(' ');
                    selector += '.' + classNames.join('.');
                    selectors.unshift(selector);
                } else {
                    selectors.unshift(selector);
                }
                closest = closest.parentNode;
            }
            fullSelector = selectors.join(' > ');
        }
        return fullSelector;
    };

    // 검색 결과로 나온 Element들의 Full Selector를 반환합니다.
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.map(getFullSelectorForElement);
};

/**
 * 지정된 부모 노드에서 지정된 선택자와 일치하는 첫 번째 요소를 반환합니다.
 *
 * @param {string} selector - 일치하는 요소를 찾기 위한 CSS 선택자입니다.
 * @param {Node=} parent - 일치하는 요소를 찾을 부모 노드입니다. 기본값은 document입니다.
 * @returns {Element|null} 일치하는 첫 번째 요소 또는 일치하는 요소가 없는 경우 null을 반환합니다.
 * @throws {TypeError} selector가 문자열이 아니거나 parent가 Node 객체가 아닌 경우 TypeError가 throw됩니다.
 */
function qs(selector, parent = document) {
    if (typeof selector !== 'string') {
        throw new TypeError('선택자는 문자열이어야 합니다.');
    }

    if (!(parent instanceof Node)) {
        throw new TypeError('부모 노드는 Node 객체여야 합니다.');
    }

    return parent.querySelector(selector);
}

/**
 * 주어진 tbodySelector로 선택한 tbody 내부의 "course-list-course-title-column course-list-no-left-border" 클래스명을 가진 td 요소들의 하위 a 요소에서 텍스트 값과 href 속성 값을 추출하여 객체 배열로 반환합니다.
 *
 * 예시 -> getTextValuesAndLinksFromTbody('#my_courses_table > tbody')
 *
 * @param {string} tbodySelector 가져올 데이터가 위치한 tbody 요소의 CSS 선택자
 * @returns {Array<{textValue: string, link: string}>} 텍스트 값과 href 속성 값을 가지는 객체들로 구성된 배열
 */
function getTextValuesAndLinksFromTbody(tbodySelector) {
    const tbody = document.querySelector(tbodySelector);

    const courses = [];

    Array.from(tbody.querySelectorAll('.course-list-course-title-column.course-list-no-left-border a')).forEach(a => {
        const course = {
            textValue: a.textContent.trim(),
            link: a.getAttribute('href'),
        };
        courses.push(course);
    });

    return courses;
}

const getCourseLecListURL = courseNum => `https://learning.hanyang.ac.kr/courses/${courseNum}/external_tools/1`;
const getCourseLecVidURL = lecCd => `https://hycms.hanyang.ac.kr/em/${lecCd}`;

const browseFile = path => fs.readFileSync(path, 'utf8');

const browseJSON = path => JSON.parse(browseFile(path));

/**
 * 페이지에서 웹 요청을 보내는 함수입니다.
 * @async
 * @function
 * @param {Object} config - 웹 요청을 위한 구성 객체입니다.
 * @param {Page} config.page - 웹 요청에 사용할 Puppeteer 페이지 객체입니다.
 * @param {string} config.url - 웹 요청을 보낼 URL입니다.
 * @param {Object=} config.headers - 웹 요청에 전송할 사용자 지정 헤더입니다.
 * @param {boolean=} config.useCookie - 웹 요청에 현재 페이지의 쿠키를 포함할지 여부를 지정합니다. 기본값은 true입니다.
 * @returns {Promise<Object[]>} 웹 요청의 응답 객체 배열을 반환하는 Promise입니다.
 */
async function usePageRequest({ page, url, headers = {}, useCookie = true }) {
    let cookies = null;

    let requestHeaders = { ...headers };
    if (useCookie) {
        cookies = await page.cookies();
        const xnApiToken = cookies.find(cookie => cookie.name === 'xn_api_token')?.value;

        requestHeaders = {
            ...requestHeaders,
            Authorization: `Bearer ${xnApiToken}`,
        };
    }

    const responseText = await page.evaluate(
        ({ url, headers }) => {
            return fetch(url, { headers }).then(res => res.text());
        },
        { url, requestHeaders }
    );

    return responseText;
}

/**
 * 페이지에서 XHR 요청을 보내는 함수입니다.
 * @async
 * @function
 * @param {Object} config - XHR 요청을 위한 구성 객체입니다.
 * @param {Page} config.page - XHR 요청에 사용할 Puppeteer 페이지 객체입니다.
 * @param {string} config.url - XHR 요청을 보낼 URL입니다.
 * @param {Object=} config.headers - XHR 요청에 전송할 사용자 지정 헤더입니다.
 * @param {boolean=} config.useCookie - XHR 요청에 현재 페이지의 쿠키를 포함할지 여부를 지정합니다. 기본값은 true입니다.
 * @returns {Promise<Object>} XHR 요청의 응답 객체를 반환하는 Promise입니다.
 */
async function usePageXHR({ page, url, headers = {}, useCookie = true }) {
    let cookies = null;
    if (useCookie) {
        cookies = await page.cookies();
        const xnApiToken = cookies.find(cookie => cookie.name === 'xn_api_token')?.value;
        headers = {
            ...headers,
            Authorization: `Bearer ${xnApiToken}`,
        };
    }

    const response = await page.evaluate(
        ({ url, headers }) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
                xhr.onload = () => {
                    resolve(xhr.responseText);
                };
                xhr.onerror = () => reject(xhr);
                xhr.send();
            });
        },
        { url, headers }
    );

    return response;
}

function saveFile(path, data) {
    fs.writeFileSync(path, data, 'utf8');
}

function saveFileAsJSON(path, data) {
    saveFile(path, JSON.stringify(data));
}

function extractInfo(objArr) {
    return objArr.map(obj => {
        return {
            assignment_id: obj.assignment_id,
            component_id: obj.component_id,
            title: obj.title,
            view_url: obj.view_info.view_url,
            unlock_at: obj.unlock_at,
            created_at: obj.created_at,
            due_at: obj.due_at,
            commons_content: obj.commons_content,
        };
    });
}

module.exports = {
    qs,
    usePageRequest,
    usePageXHR,
    saveFileAsJSON,
    extractInfo,
    browseJSON,
};
