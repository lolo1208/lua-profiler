/**
 * Created by LOLO on 2018/10/18.
 */


const os = require('os');


/**
 * 获取本机 IPv4 地址
 * @return {string}
 */
function getIP() {
    let ip = '';
    let niFaces = os.networkInterfaces();
    for (let key in niFaces) {
        let val = niFaces[key];
        for (let i = 0; i < val.length; i++) {
            let v = val[i].address;
            if (val[i].family === 'IPv4' && v !== '127.0.0.1') ip = v;
        }
    }
    return ip;
}


//
module.exports = {getIP};