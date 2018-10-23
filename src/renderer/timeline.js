/**
 * Created by LOLO on 2018/9/10.
 */


let aveFrameTime = 0;// 平均帧时间
let aveMem = 0;// 平均使用内存值

let isCurrent = true;// 是否选中当前（最新）帧
let beginX = 0;// 鼠标按下时（开始）的位置
let currentX = 0;// 当前位置

let renderDirty = true;// 是否需要渲染标记
let drawHandle = null;
let showDetailsHandle = null;
let isRenderAll = false;
let isMouseDown = false;


const drawTimeline = function () {
    // 定时刷新
    clearTimeout(drawHandle);
    drawHandle = setTimeout(drawTimeline, 16);

    if (!renderDirty) return;
    renderDirty = false;


    let tlDiv = document.getElementById('timeline');
    let cavansDiv = document.getElementById('tlCanvasDiv');
    let canvas = document.getElementById('tlCanvas');
    let ctx = canvas.getContext('2d');
    canvas.onmousedown = canvasMouseDown;

    // 计算出宽高，设置 canvas 的宽高，会清除 canvas 的当前内容
    let tlWidth = Math.floor(tlDiv.getBoundingClientRect().width);
    let cvsWidth = Math.max(totalFrames, tlWidth);
    canvas.style.width = `${cvsWidth}px`;
    canvas.width = cvsWidth;

    let cvsRect = cavansDiv.getBoundingClientRect();
    let cvsHeight = cvsRect.height;
    if (cvsWidth > tlWidth) cvsHeight -= cavansDiv.offsetHeight - cavansDiv.clientHeight;
    canvas.style.height = `${cvsHeight}px`;
    canvas.height = cvsHeight;


    // 画出帧数据
    let [frameH, memH] = [Math.floor((cvsHeight - 5) * 0.65), Math.floor((cvsHeight - 5) * 0.35)];
    let memY = frameH + 5;
    let MAX_TIME = aveFrameTime * 1.8;
    let MAX_MEM = aveMem * 1.8;

    // 只绘制当前显示范围内的数据
    let [i, len] = [0, totalFrames];
    if (!isRenderAll && totalFrames > tlWidth) {
        i = cavansDiv.scrollLeft;
        len = i + cvsRect.width;
    }
    isRenderAll = false;

    let offsetX = (tlWidth > totalFrames) ? (tlWidth - totalFrames) : 0;
    for (; i < len; i++) {
        let data = frameData[i];
        let x = i + offsetX;
        let ratio, h, y;

        // 画帧耗时
        let time = Math.min(data.time, MAX_TIME);
        ratio = time / MAX_TIME;
        h = frameH * ratio;
        if (isNaN(h) || h < 2) h = 2;
        y = frameH - h;
        ctx.fillStyle = '#1095D2';
        ctx.fillRect(x, y, 1, h);

        // 画内存占用
        let mem = Math.min(data.mem, MAX_MEM);
        ratio = mem / MAX_MEM;
        h = memH * ratio;
        y = memH - h + memY;
        ctx.fillStyle = '#D37656';
        ctx.fillRect(x, y, 1, h);
    }

    // 画警告线
    ctx.fillStyle = '#FFC';
    ctx.fillRect(0, frameH / 2, cvsWidth, 0.5);
    ctx.fillRect(0, memY + memH / 2, cvsWidth, 0.5);

    // 画边框
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, cvsWidth, 1);


    // 查看当前帧
    if (isCurrent) {
        if (curClientItemInfo && curClientItemInfo.connected)
            cavansDiv.scrollLeft = cavansDiv.scrollWidth;// 滚动到最后
        beginX = currentX = totalFrames - 1;
    }
    else {
        if (currentX < 0) currentX = 0;
        if (currentX >= totalFrames) currentX = totalFrames - 1;
    }


    if (totalFrames > 0) {

        // 绘制选中区域
        let [begin, end] = [beginX + offsetX, currentX + offsetX];
        if (begin > end) [begin, end] = [end, begin];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';// 半透明遮盖
        ctx.fillRect(begin, 1, end - begin + 1, cvsHeight - 2);
        ctx.fillStyle = '#DCDFE6';// 前后标记线
        ctx.fillRect(Math.max(begin - 1, 0), 1, 1, cvsHeight - 2);
        ctx.fillRect(Math.min(end + 1, end), 1, 1, cvsHeight - 2);


        // 显示选中区域的信息
        begin -= offsetX;
        end -= offsetX;
        let fps = 0;
        for (let i = begin; i <= end; i++)
            fps += frameData[i].fps;
        fps /= end - begin + 1;
        fps = fps.toFixed(1);

        let frameText = document.getElementById('frameText');
        frameText.textContent = isCurrent
            ? `FPS: ${fps}　Frame: ${getFrameNum(currentX)} (Current)`
            : `FPS: ${fps}　Frame: ${getFrameNum(begin)} - ${getFrameNum(end)}`;


        // 更新选中帧的函数调用信息
        clearTimeout(showDetailsHandle);
        if (isMouseDown)
            showDetailsHandle = setTimeout(refreshDetails, 50, begin, end);
        else
            refreshDetails(begin, end);
    }
};


/**
 * 根据数组索引，获取对应的帧编号
 * @param index
 */
const getFrameNum = function (index) {
    return frameData[index].frame;
};


/**
 * 点击 canvas
 * @param event
 */
const canvasMouseDown = function (event) {
    isCurrent = false;
    let canvas = document.getElementById('tlCanvas');
    canvas.onmousemove = canvasMouseMove;
    canvas.onmouseup = canvasMouseEnd;
    canvas.onmouseout = canvasMouseEnd;
    beginX = currentX = getX(event.layerX);
    renderDirty = true;
    isMouseDown = true;
};

const canvasMouseMove = function (event) {
    currentX = getX(event.layerX);
    renderDirty = true;
};

const canvasMouseEnd = function (event) {
    let canvas = document.getElementById('tlCanvas');
    canvas.onmousemove = canvas.onmouseup = canvas.onmouseout = null;
    currentX = getX(event.layerX);
    renderDirty = true;
    isMouseDown = false;
};

const getX = function (x) {
    let tlDiv = document.getElementById('timeline');
    let tlWidth = Math.floor(tlDiv.getBoundingClientRect().width);
    let offsetX = (tlWidth > totalFrames) ? (tlWidth - totalFrames) : 0;
    return Math.max(x - offsetX, 0);
};


//


//
// start
//
drawHandle = setTimeout(drawTimeline, 16);

