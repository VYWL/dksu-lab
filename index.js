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

/**
 * 과제 목록 정보를 불러오는 함수
 *
 * @param {string} apiUrl - API 엔드포인트 URL
 * @returns {Promise<object[]>} - 과제 목록 정보가 담긴 객체 배열을 반환하는 Promise 객체
 */
function fetchTaskList(apiUrl) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);

        const cookies = document.cookie.split('; ').reduce((cookieObj, cookieString) => {
            const [key, value] = cookieString.split('=');
            cookieObj[key] = value;
            return cookieObj;
        }, {});

        const token = cookies['xn_api_token'];
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                const taskList = JSON.parse(xhr.responseText);
                resolve(taskList);
            } else {
                reject(new Error(`Failed to load task list (status ${xhr.status})`));
            }
        };

        xhr.onerror = function () {
            reject(new Error('Failed to load task list'));
        };

        xhr.send();
    });
}

const getCourseLecListURL = lecNum => `https://learning.hanyang.ac.kr/courses/${lecNum}/external_tools/1`;
const getCourseLecVidURL = lecCd => `https://hycms.hanyang.ac.kr/em/${lecCd}`;

const browseFile = path => fs.readFileSync(path, 'utf8');

const browseJSON = path => JSON.parse(browseFile(path));

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
        };
    });
}

module.exports = {
    qs,
};
