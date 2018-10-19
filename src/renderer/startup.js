/**
 * Created by LOLO on 2018/8/29.
 */

const {shell} = require('electron');

let MAX_PROFILER_TOP = 62;
let curProfilerTop = MAX_PROFILER_TOP;


/**
 * 显示或隐藏启动界面
 * @param visible
 */
const showOrHideStartup = function (visible) {
    if (visible === startup.visible) return;
    startup.visible = visible;
    startupFading();
};

const startupFading = function () {
    if (startup.visible) {
        curProfilerTop += 5;
        curProfilerTop >= MAX_PROFILER_TOP
            ? curProfilerTop = MAX_PROFILER_TOP
            : setTimeout(startupFading, 16);
    }
    else {
        curProfilerTop -= 5;
        curProfilerTop <= 0
            ? curProfilerTop = 0
            : setTimeout(startupFading, 16);
    }
    document.getElementById('profiler').style.top = `${curProfilerTop}px`;
};


/**
 * 点击启动按钮
 */
const clickStartupBtn = function () {
    ipcRenderer.send('startup-or-shutdown', startup.port, startup.isTCP);
};


/**
 * 点击帮助按钮
 */
const clickHelpBtn = function () {
    shell.openExternal('https://github.com/lolo1208/lua-profiler');
};


/**
 * 点击工具按钮
 */
const clickToolsBtn = function () {
    ipcRenderer.send('open-tools');
};


//


//


const startup = new Vue({
    el: '#startup',


    methods: {
        clickStartupBtn
    },


    data: function () {
        return {
            isTCP: true,
            ip: '123.123.123.123',
            port: '1208',
            visible: true,
            startupBtnType: 'success',
            startupDisabled: false,
        }
    }
});

