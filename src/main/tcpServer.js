/**
 * Created by LOLO on 2018/10/19.
 */


const net = require('net');

const {ipcMain} = require('electron');
const {sendToRender, emptyFn} = require('./functions');


let clients = [];
let server = null;


//


/**
 * new client
 * @param socket
 */
const onConnection = function (socket) {
    clients.push(socket);

    let arr = socket.remoteAddress.split(':');// IPv6
    let key = `${arr[arr.length - 1]}:${socket.remotePort}`;
    socket._key = key;
    socket._data = null;
    socket._msgLength = -1;

    socket.on('data', onData);
    socket.on('error', onDisconnect);
    socket.on('close', onDisconnect);
    socket.on('end', onDisconnect);
    socket.on('timeout', onDisconnect);

    // 通知渲染进程
    sendToRender('new-connected', key);
};


/**
 * client on data
 * @param data
 */
const onData = function (data) {
    if (data !== null) {
        if (this._data !== null)
            this._data = Buffer.concat([this._data, data], this._data.length + data.length);
        else
            this._data = data;
    }

    if (this._msgLength === -1) {
        if (this._data.length < 4) return;
        this._msgLength = this._data.readUInt32LE(0);
        this._data = this._data.slice(4);
    }
    if (this._data.length < this._msgLength) return;

    let str = this._data.toString('utf8', 0, this._msgLength);
    this._data = this._data.slice(this._msgLength);
    this._msgLength = -1;

    // 通知渲染进程
    sendToRender('append-data', this._key, str);

    if (this._data.length >= 4) this.onData(null);
};


/**
 * client on disconnect
 */
const onDisconnect = function () {
    this.on('error', emptyFn);
    this.on('close', emptyFn);
    this.on('end', emptyFn);
    this.on('timeout', emptyFn);
    this.destroy();

    // 通知渲染进程
    sendToRender('disconnect', this._key);
};


//


/**
 * 主动断开会话
 */
ipcMain.on('disconnect', function (event, key) {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i]._key === key) {
            onDisconnect.call(clients[i]);
            clients.splice(i, 1);
            return;
        }
    }
});


//


/**
 * server error
 * @param err
 */
const onError = function (err) {
    console.log(`TCP server error:\n${err.stack}`);
    closeTCP();
};


/**
 * listening
 */
const onListening = function () {
    sendToRender('startup-or-shutdown', 'startup');
};


//


/**
 * 启动服务
 * @param port
 */
const startTCP = function (port) {
    if (server !== null) return;

    server = net.createServer();
    server.on('listening', onListening);
    server.on('connection', onConnection);
    server.on('error', onError);
    server.on('close', closeTCP);
    server.listen(port);
};


/**
 * 停止服务
 */
const closeTCP = function () {
    if (server === null) return;

    server.on('listening', emptyFn);
    server.on('connection', emptyFn);
    server.on('error', emptyFn);
    server.on('close', emptyFn);
    server.close();
    server = null;

    for (let i = 0; i < clients.length; i++)
        onDisconnect.call(clients[i]);
    clients.length = 0;

    sendToRender('startup-or-shutdown', 'shutdown');
};


//


//
module.exports = {
    startTCP,
    closeTCP,
};
