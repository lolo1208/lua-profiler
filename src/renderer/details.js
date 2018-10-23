/**
 * Created by LOLO on 2018/9/14.
 */


let detailsData = [];
let [detailsBeginIdx, detailsEndIdx] = [-1, -1];

let refreshDetailsHandle = null;

let sortType = 'name';
let sortIcon = null;


//
const currentTreeItemChanged = function (data, node) {
    // console.log(data.name);
};


/**
 * 鼠标移到 item 上，显示行号
 * @param dom
 */
const treeItemMouseOver = function (dom) {
    let line = dom.getElementsByTagName('code')[0].innerText;
    dom = document.getElementById('details-line');
    dom.style.display = '';
    dom.innerText = `line: ${line}`;
};
const treeItemMouseOut = function () {
    document.getElementById('details-line').style.display = 'none';
};


const refreshDetailsItemBg = function (count) {
    let items = document.getElementsByClassName("el-tree-node");
    let offset = 0;
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (item.offsetParent === null) {
            offset++;
            continue;
        }
        item.style.backgroundColor = (i - offset) % 2 ? "#606060" : "#555";
    }

    clearTimeout(refreshDetailsHandle);
    if (isNaN(count) || count < 30) // 多刷几次
        refreshDetailsHandle = setTimeout(refreshDetailsItemBg, 15, isNaN(count) ? 0 : count + 1);
};


/**
 * 刷新选中帧的函数调用详情
 * @param begin
 * @param end
 */
const refreshDetails = function (begin, end) {
    if (begin === detailsBeginIdx && end === detailsEndIdx) return;
    detailsBeginIdx = begin;
    detailsEndIdx = end;

    let list = [];
    if (begin === end) {
        list = frameData[begin].data;
    }
    else {
        for (let i = begin; i <= end; i++) {
            let fData = frameData[i].data;
            for (let n = 0; n < fData.length; n++)
                appendDetails(list, fData[n]);
        }
    }

    detailsData.length = 0;
    for (let i = 0; i < list.length; i++) {
        detailsData[i] = list[i];
    }
    showDetailsData();
};


const appendDetails = function (source, data) {
    let notFind = true;
    for (let i = 0; i < source.length; i++) {
        let item = source[i];
        if (item.name === data.name && item.line === data.line) {
            notFind = false;
            item.self += data.self;
            item.total += data.total;
            item.calls += data.calls;

            // 继续合并子集
            if (data.children !== undefined) {
                if (item.children === undefined) {
                    item.children = cloneTarget(data.children);
                }
                else {
                    for (let n = 0; n < data.children.length; n++)
                        appendDetails(item.children, data.children[n]);
                }
            }
        }
    }
    if (notFind) source.push(cloneTarget(data));
};


const showDetailsData = function () {
    profiler.detailsData = sortDetailsData(cloneTarget(detailsData));

    clearTimeout(refreshDetailsHandle);
    if (!isCurrent || !curClientItemInfo.connected)
        refreshDetailsItemBg();
    else
        refreshDetailsHandle = setTimeout(refreshDetailsItemBg, 500);
};


//


/**
 * 更改排序规则
 * @param type
 * @param ele
 */
const changeDetailsSort = function (type, ele) {
    if (sortType === type) return;
    if (sortIcon === null) sortIcon = document.getElementsByClassName("el-icon-arrow-up")[0];
    sortIcon.style.display = 'none';
    // sortIcon.style.visibility = 'hidden';

    sortType = type;
    sortIcon = ele.getElementsByTagName('i')[0];
    sortIcon.style.display = '';
    // sortIcon.style.visibility = 'visible';

    showDetailsData();
};


const sortDetailsData = function (data) {
    switch (sortType) {
        case 'name':
            data = data.sort(sortDetailsByName);
            break;
        case 'self':
            data = data.sort(sortDetailsBySelf);
            break;
        default:
            data = data.sort(sortDetailsByTotalOrCalls);
    }

    for (let i = 0; i < data.length; i++) {
        if (data[i].children !== undefined)
            data[i].children = sortDetailsData(data[i].children);
    }

    return data;
};

const sortDetailsByName = function (a, b) {
    let [acc, bcc] = [a.name.charCodeAt(0), b.name.charCodeAt(0)];
    if (acc > 96) acc -= 100;// 小写字母
    if (bcc > 96) bcc -= 100;
    return acc - bcc;
};

const sortDetailsBySelf = function (a, b) {
    if (b.self > a.self) return 1;
    if (a.self > b.self) return -1;
    return b.total - a.total;
};

const sortDetailsByTotalOrCalls = function (a, b) {
    return b[sortType] - a[sortType];
};


//


//


/**
 * 深度克隆目标对象
 * @param target
 * @returns {*}
 */
const cloneTarget = function (target) {
    if (target === null || typeof target !== "object") return target;

    if (target instanceof Array) {
        let newArr = [];
        let len = target.length;
        for (let i = 0; i < len; ++i) {
            newArr[i] = cloneTarget(target[i]);
        }
        return newArr;
    }

    if (target instanceof Object) {
        let newObj = {};
        for (let prop in target) {
            newObj[prop] = cloneTarget(target[prop]);
        }
        return newObj;
    }
};