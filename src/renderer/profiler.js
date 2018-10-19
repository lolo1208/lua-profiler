/**
 * Created by LOLO on 2018/9/3.
 */


/**
 * 点击查看当前帧按钮
 */
const clickCurrentBtn = function () {
    isCurrent = true;
    renderDirty = true;
    drawTimeline();
};


//


/**
 * 点击开始按钮
 */
const clickStartBtn = function () {
    showOrHideStartup(!startup.visible);
};


//


/**
 * 点击清空数据按钮
 */
const clickClearBtn = function () {
    originalData.length = 0;
    clear();
};


/**
 * 点击中断连接按钮
 */
const clickStopBtn = function () {
    profiler.stopBtnDisabled = true;
    curClientItemInfo.connected = false;
    ipcRenderer.send('disconnect');
};


/**
 * 点击加载数据按钮
 */
const clickLoadBtn = function () {
    ipcRenderer.send('open-file');
};


/**
 * 点击保存数据按钮
 */
const clickSaveBtn = function () {
    ipcRenderer.send('save-file', JSON.stringify(originalData));
};


//


//


const profiler = new Vue({
    el: '#profiler',


    methods: {
        currentTreeItemChanged,
        refreshDetailsItemBg,
        clickCurrentBtn,
        clickClearBtn,
        clickStopBtn,
        clickLoadBtn,
        clickSaveBtn,
    },


    data: function () {
        return {
            clearBtnDisabled: true,
            stopBtnDisabled: true,
            saveBtnDisabled: true,

            startBtnType: 'danger',
            detailsData: [],
            detailsProps: {
                children: 'children',
                name: 'name'
            },
            placeholder: '　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　',
        };
    },
});