/**
 * Created by LOLO on 2018/10/12.
 */


const fs = require('fs');
const kcp = require('node-kcp');
const dgram = require('dgram');

const {BrowserWindow, ipcMain, dialog} = require('electron');


let CONV = 0;
let updateTimer = null;
let clients = {};
let server = null;


/**
 * recv client data, input to kcp
 * @param data
 * @param rinfo
 */
const serverOnMessage = function (data, rinfo) {
    let key = `${rinfo.address}:${rinfo.port}`;
    let kcpObj = clients[key];

    // 首次连接
    if (kcpObj === undefined) {
        let context = {
            address: rinfo.address,
            port: rinfo.port
        };
        kcpObj = new kcp.KCP(CONV, context);
        kcpObj.nodelay(1, 10, 2, 1);
        kcpObj.output(output);
        clients[key] = kcpObj;

        kcpObj._data = null;
        kcpObj._msgLength = -1;

        // 通知渲染进程
        sendMsg('new-connected', key);
    }

    // 尝试获取数据
    kcpObj.input(data);
    let recv = kcpObj.recv();
    if (recv !== undefined) readData(kcpObj, key, recv);
};


/**
 * read data, decode message
 * @param kcpObj
 * @param key
 * @param recv
 */
const readData = function (kcpObj, key, recv) {
    if (recv !== null) {
        if (kcpObj._data !== null)
            kcpObj._data = Buffer.concat([kcpObj._data, recv], kcpObj._data.length + recv.length);
        else
            kcpObj._data = recv;
    }

    // 前四个字节为内容长度
    if (kcpObj._msgLength === -1) {
        if (kcpObj._data.length < 4) return;
        kcpObj._msgLength = kcpObj._data.readUInt32LE(0);
        kcpObj._data = kcpObj._data.slice(4);
    }
    if (kcpObj._data.length < kcpObj._msgLength) return;

    // 读取字符串内容
    let str = kcpObj._data.toString("utf8", 0, kcpObj._msgLength);
    kcpObj._data = kcpObj._data.slice(kcpObj._msgLength);
    kcpObj._msgLength = -1;

    // 通知渲染进程
    sendMsg('append-data', key, str);

    // str = '服务端收到：' + str;
    // let len = Buffer.byteLength(str);
    // let buffer = new Buffer(len + 4);
    // buffer.writeInt32LE(len, 0);
    // buffer.write(str, 4);
    // kcpObj.send(buffer);

    // 还有数据，继续读取
    if (kcpObj._data.length >= 4)
        readData(kcpObj, key, null);
};


/**
 * send to client
 * @param data
 * @param size
 * @param context
 */
const output = function (data, size, context) {
    server.send(data, 0, size, context.port, context.address);
};


/**
 * server error
 * @param err
 */
const serverOnError = function (err) {
    console.log(`server error:\n${err.stack}`);
    closeServer();
};


/**
 * listening port
 */
const serverOnListening = function () {
    sendMsg('startup-or-shutdown', 'startup');

    clearInterval(updateTimer);
    updateTimer = setInterval(function () {
        let time = Date.now();
        for (let key in clients)
            clients[key].update(time);
    }, 10);
};


/**
 * server close
 */
const closeServer = function () {
    if (server === null) return;
    clearInterval(updateTimer);
    server.close();
    server.unref();
    server = null;

    sendMsg('startup-or-shutdown', 'shutdown');
};


//


/**
 * 启动或停止
 */
ipcMain.on('startup-or-shutdown', function (event, port) {
    if (server !== null) {
        closeServer();
        return;
    }

    CONV = Number(port);
    server = dgram.createSocket('udp4');
    server.on('listening', serverOnListening);
    server.on('message', serverOnMessage);
    server.on('error', serverOnError);
    server.on('close', closeServer);
    server.bind(port);
    server.ref();
});


/**
 * 发送消息到渲染进程
 * @param channel
 * @param args
 */
const sendMsg = function (channel, ...args) {
    try {
        let wc = BrowserWindow.getAllWindows()[0].webContents;
        wc.send(channel, ...args);
    } catch (err) {
    }
};


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
    let win = BrowserWindow.getAllWindows()[0];
    win.openDevTools({mode: 'detach'});

});


