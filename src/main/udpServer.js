/**
 * Created by LOLO on 2018/10/19.
 */


const kcp = require('node-kcp');
const dgram = require('dgram');

const {sendToRender, emptyFn} = require('./functions');


let CONV = 0;
let updateTimer = null;
let clients = {};
let server = null;


//


/**
 * recv client data, input to kcp
 * @param data
 * @param rinfo
 */
const onMessage = function (data, rinfo) {
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
        kcpObj.wndsize(256, 256);
        kcpObj.output(output);
        clients[key] = kcpObj;

        kcpObj._data = null;
        kcpObj._msgLength = -1;

        // 通知渲染进程
        sendToRender('new-connected', key);
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
    let str = kcpObj._data.toString('utf8', 0, kcpObj._msgLength);
    kcpObj._data = kcpObj._data.slice(kcpObj._msgLength);
    kcpObj._msgLength = -1;

    // 通知渲染进程
    sendToRender('append-data', key, str);

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
const onError = function (err) {
    console.log(`UDP server error:\n${err.stack}`);
    closeUDP();
};


/**
 * listening
 */
const onListening = function () {
    sendToRender('startup-or-shutdown', 'startup');

    clearInterval(updateTimer);
    updateTimer = setInterval(function () {
        let time = Date.now();
        for (let key in clients)
            clients[key].update(time);
    }, 10);
};


//


/**
 * 启动服务
 * @param port
 */
const startUDP = function (port) {
    if (server !== null) return;

    CONV = Number(port);
    server = dgram.createSocket('udp4');
    server.on('listening', onListening);
    server.on('message', onMessage);
    server.on('error', onError);
    server.on('close', closeUDP);
    server.bind(port);
};


/**
 * 停止服务
 */
const closeUDP = function () {
    if (server === null) return;

    clearInterval(updateTimer);
    server.on('listening', emptyFn);
    server.on('message', emptyFn);
    server.on('error', emptyFn);
    server.on('close', emptyFn);
    server.close();
    server = null;
    clients = {};
    sendToRender('startup-or-shutdown', 'shutdown');
};


//


//
module.exports = {
    startUDP,
    closeUDP,
};
