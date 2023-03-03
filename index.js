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
