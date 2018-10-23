/**
 * Created by LOLO on 2018/10/16.
 */


const ipcRenderer = require('electron').ipcRenderer;


// connection key to index
const connK2I = {};


//
// 注册来自主进程的调用
//


/**
 * 加载文件完成
 */
ipcRenderer.on('load-file-completed', function (event, path, jsonStr) {
    let idx = addClientItem({name: path, originalData: JSON.parse(jsonStr)});
    selectClientItem(idx);
    showOrHideStartup(false);
});


/**
 * 保存文件完成
 */
ipcRenderer.on('save-file-completed', function (event, path) {
    profiler.$notify({
        title: '保存成功',
        message: `路径：${path}`,
        type: 'success'
    });
});


/**
 * 启动或停止状态有改变
 */
ipcRenderer.on('startup-or-shutdown', function (event, state) {
    let inStartup = state === 'startup';

    let startBtn = document.getElementById('startBtn');
    startBtn.style.backgroundColor = inStartup ? '#444' : '#F56C6C';
    startBtn.getElementsByTagName('i')[0].className = inStartup ? 'el-icon-success' : 'el-icon-warning';
    startBtn.getElementsByTagName('span')[0].innerText = inStartup ? '程序已启动' : '程序未启动';

    let startupBtn = document.getElementById('startupBtn');
    startupBtn.innerText = inStartup ? '停止' : '启动';
    startup.startupDisabled = inStartup;
    startup.startupBtnType = inStartup ? 'danger' : 'success';

    showOrHideStartup(!inStartup);

    if (!inStartup) {
        for (let i = 0; i < clientList.length; i++)
            clientList[i].connected = false;
    }
});


/**
 * 连接了新的会话
 */
ipcRenderer.on('new-connected', function (event, key) {
    connK2I[key] = addClientItem({name: key, originalData: [], connected: true});
});


/**
 * 会话推来了新数据
 */
ipcRenderer.on('append-data', function (event, key, data) {
    let index = connK2I[key];
    let info = clientList[index];
    if (!info.connected) return;// 已经手动断开连接了

    data = JSON.parse(data);
    info.originalData.push(data);

    // 是当前选中的会话
    if (info === curClientItemInfo) appendFrameData(data);
});


/**
 * 有会话断开了连接（TCP）
 */
ipcRenderer.on('disconnect', function (event, key) {
    let index = connK2I[key];
    let info = clientList[index];
    info.connected = false;

    // 是当前选中的会话
    if (info === curClientItemInfo) profiler.stopBtnDisabled = true;
});


//

//


/**
 * ！！入口 ！！
 * 页面加载完毕
 */
ipcRenderer.once('dom-ready', (event, ip) => {
    clear();
    document.getElementById('clientList').innerText = '';
    document.addEventListener('mousedown', stageMouseDown);
    startup.ip = ip;

});

const stageMouseDown = function () {
    isRenderAll = renderDirty = true;
};


