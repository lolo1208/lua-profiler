/**
 * Created by LOLO on 2018/9/15.
 */


let fnNameList = {};// 函数名称列表
let fnLineList = {};// 函数所在行号列表
let frameData = [];// 帧数据列表
let originalData = []; // 原始数据列表（引用对象）
let totalFrames = 0;// 已采集的总帧数

let clientList = [];
let curClientItemInfo = null;


/**
 * 添加新的数据（渲染到时间轴）
 * @param data
 */
const appendFrameData = function (data) {
    // originalData.push(data);

    // 记录新增函数信息
    for (let key in data.d.n) {
        let info = data.d.n[key];
        if (info.s.startsWith('@')) info.s = info.s.substr(1);
        if (info.n === '') info.n = '[unknown]';
        fnNameList[key] = `${info.s}.${info.n}`;
        fnLineList[key] = info.l;
    }

    // 解析成帧数据
    let item = {
        frame: data.f, // 帧编号
        fps: data.r,   // 帧率
        mem: data.c,   // 占用内存
        time: 0,       // 帧总耗时
        data: [],      // 函数调用信息列表
    };
    frameData.push(item);

    // 解析函数调用信息
    for (let key in data.d.t.c)
        item.data.push(parseFnInfo(key, data.d.t.c[key]));

    // 帧总耗时
    for (let i = 0; i < item.data.length; i++)
        item.time += item.data[i].total;

    // 总帧数
    totalFrames++;

    // 更新平均帧时间和平均内存占用
    let [t, m] = [0, 0];
    for (let i = 0; i < totalFrames; i++) {
        t += frameData[i].time;
        m += frameData[i].mem;
    }
    aveFrameTime = t / totalFrames;
    aveMem = m / totalFrames;
    document.getElementById('frameTimeText').innerText = `${(aveFrameTime * 0.9).toFixed(1)} µs`;
    document.getElementById('memText').innerText = `${(aveMem * 0.9).toFixed(1)} MB`;

    renderDirty = true;
};


const parseFnInfo = function (key, data, parent) {
    let item = {
        key: key,
        name: fnNameList[key],
        line: fnLineList[key],
        self: data.t,
        total: data.t,
        calls: data.n,
    };

    if (parent) {
        // 加入到父节点
        if (!parent.children) parent.children = [];
        parent.children.push(item);

        // 在父节点中减去当前节点的总耗时
        parent.self -= item.total;
        if (parent.self < 0) parent.self = 0;// 四舍五入的原因
    }

    // 解析子节点
    if (data.c) {
        for (let k in data.c)
            parseFnInfo(k, data.c[k], item);
    }

    return item;
};


/**
 * 清空数据，界面
 */
const clear = function () {
    profiler.detailsData = [];

    fnNameList = {};
    fnLineList = {};
    frameData.length = 0;
    totalFrames = 0;

    detailsData.length = 0;
    detailsBeginIdx = detailsEndIdx = -1;
    clearTimeout(refreshDetailsHandle);

    aveFrameTime = 0;
    aveMem = 0;
    isCurrent = true;
    beginX = 0;
    currentX = 0;
    renderDirty = true;

    document.getElementById('frameText').innerText = '';
    document.getElementById('frameTimeText').innerText = '';
    document.getElementById('memText').innerText = '';
};


/**
 * 加载原始数据
 * @param data
 */
const loadOriginalData = function (data) {
    clear();
    for (let i = 0; i < data.length; i++)
        appendFrameData(data[i]);
    isRenderAll = true;
};


//


/**
 * 添加一条会话信息
 * @param data <name, originalData, index, connected>
 * @return index
 */
const addClientItem = function (data) {
    // 添加到数据列表
    data.index = clientList.length;
    clientList.push(data);


    // 添加到 DOM
    let listDOM = document.getElementById('clientList');
    listDOM.innerHTML = `${listDOM.innerHTML}
        <p class="clientItem clientItemSelected" onclick="selectClientItem(${data.index})">
            ${data.name}
        </p>
    `;

    // 处理名称过长
    let itemDOM = listDOM.getElementsByTagName('p')[data.index];
    let [s, l, a, b] = [data.name, data.name.length, 10, 16];
    while (itemDOM.scrollWidth > 180) {
        itemDOM.innerText = `${s.substr(0, a)} ... ${s.substr(l - b)}`;
        itemDOM.title = s;
        a--;
        b--;
    }
    itemDOM.className = 'clientItem';

    // 还未选中任何会话
    if (curClientItemInfo === null) selectClientItem(data.index);

    return data.index;
};


/**
 * 选中会话 item
 * @param index
 */
const selectClientItem = function (index) {
    let doms = document.getElementById('clientList').getElementsByTagName("p");
    if (curClientItemInfo !== null) {
        // 选中的是当前会话
        if (index === curClientItemInfo.index) return;
        // 取消选中之前会话的 DOM
        doms[curClientItemInfo.index].className = 'clientItem';
    }

    curClientItemInfo = clientList[index];

    // 选中新会话的 DOM
    doms[index].className = 'clientItem clientItemSelected';

    // 显示当前数据
    originalData = curClientItemInfo.originalData;
    loadOriginalData(originalData);

    // 启用操作按钮
    profiler.clearBtnDisabled = profiler.saveBtnDisabled = false;
    profiler.stopBtnDisabled = curClientItemInfo.connected !== true;
};


//


//


/**
 * 页面尺寸有改变
 */
const onResize = function () {
    renderDirty = true;
};


//





