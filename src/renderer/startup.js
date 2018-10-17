/**
 * Created by LOLO on 2018/8/29.
 */


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
    ipcRenderer.send('startup-or-shutdown', startup.port);
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
            ip: '123.123.123.123',
            port: '1208',
            visible: true,
            startupBtnType: 'success',
            portTextDisabled: false,
        }
    }
});

