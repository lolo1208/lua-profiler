/**
 * Created by LOLO on 2018/10/12.
 */


const fs = require('fs');

const {BrowserWindow, ipcMain, dialog} = require('electron');
const {startTCP, closeTCP} = require('./tcpServer');
const {startUDP, closeUDP} = require('./udpServer');


let running = false;


//


/**
 * 启动或停止
 */
ipcMain.on('startup-or-shutdown', function (event, port, isTCP) {
    if (running) {
        closeTCP();
        closeUDP();
    }
    else {
        isTCP ? startTCP(port) : startUDP(port);
    }
    running = !running;
});


//


//


/**
 * 打开数据文件
 */
ipcMain.on('open-file', function (event) {
    dialog.showOpenDialog(
        {
            title: '打开 Lua Profiler 数据文件',
            properties: ['openFile'],
            filters: [{name: 'JSON', extensions: ['json']}]
        },
        function (filenames) {
            if (filenames === undefined) return;

            let path = filenames[0];
            let jsonStr = fs.readFileSync(path, 'utf-8');
            event.sender.send('load-file-completed', path, jsonStr);
        }
    );
});


/**
 * 保存数据文件
 */
ipcMain.on('save-file', function (event, jsonStr) {
    dialog.showSaveDialog(
        {
            title: '保存 Lua Profiler 数据文件',
            filters: [{name: 'JSON', extensions: ['json']}]
        },
        function (filename) {
            if (filename === undefined) return;

            fs.writeFileSync(filename, jsonStr, 'utf-8');
            event.sender.send('save-file-completed', filename);
        }
    );
});


/**
 * 打开开发者工具
 */
ipcMain.on('open-tools', function (event) {
    let wnd = BrowserWindow.getAllWindows()[0];
    wnd.openDevTools({mode: 'detach'});
});


