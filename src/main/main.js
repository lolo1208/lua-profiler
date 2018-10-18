require('./server');


const os = require('os');

// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({minWidth: 800, minHeight: 600});

    mainWindow.webContents.once('dom-ready', () => {
        let IP = '';
        let niFaces = os.networkInterfaces();
        for (let key in niFaces) {
            let val = niFaces[key];
            for (let i = 0; i < val.length; i++)
                if (val[i].family === 'IPv4')
                    IP = val[i].address;
        }
        mainWindow.webContents.send('dom-ready', IP);
    });

    // and load the index.html of the app.
    mainWindow.loadFile('./src/renderer/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    // 打开开发者工具
    // mainWindow.openDevTools({mode: 'detach'});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
