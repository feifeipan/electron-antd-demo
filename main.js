const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;


const autoUpdater = require('electron').autoUpdater
const appVersion = require('./package.json').version;
const os = require('os').platform();


const path = require('path')
const url = require('url')
const service = require('./service');
let PORT;
service((port)=>{
  PORT = port;
});

const ipc = electron.ipcMain
const dialog = electron.dialog

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 700})

  // and load the index.html of the app.
  mainWindow.loadURL('http://127.0.0.1:'+ PORT +'/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  ipc.on('open-file-dialog', function (event) {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    }, function (files) {
      if (files) event.sender.send('selected-directory', files)
    })
  })

}

function ready(){
  createWindow();
  startupEventHandle();
  updaterHandle();
}
function startupEventHandle(){
  if(require('electron-squirrel-startup')) return;
  var handleStartupEvent = function () {
    if (process.platform !== 'win32') {
      return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
      case '--squirrel-install':
      case '--squirrel-updated':
        install();
        return true;
      case '--squirrel-uninstall':
        uninstall();
        app.quit();
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
      // 安装
    function install() {
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
    }
    // 卸载
    function uninstall() {
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
    }
  };
  if (handleStartupEvent()) {
    return ;
  }
}
function updaterHandle(){
  ipc.on('check-for-update', function(event, arg) {
    let message={
      error:'检查更新出错',
      checking:'正在检查更新……',
      updateAva:'又有新版本了，app正在下载',
      updateNotAva:'现在使用的就是最新版本，不用更新',
      downloaded:'新版本已下载完成，将在重启程序后更新'
    };
    let appName='Ares GUI';
    var url = process.platform !== 'win32' ? 'http://app.ares.fx.ctripcorp.com/updates/latest?v='+ appVersion : 'http://git.dev.sh.ctripcorp.com/ares/ares-gui-release/raw/master/win32/'
    autoUpdater.setFeedURL(url);
    autoUpdater.on('error', function(error){
      return dialog.showMessageBox(mainWindow, {
          type: 'info',
          buttons: ['OK'],
          title: appName,
          message: message.error,
          detail: '\r'+error
      });
    })
    // .on('checking-for-update', function(e) {
    //     //# 正在检查更新
    //     return dialog.showMessageBox(mainWindow, {
    //       type: 'info',
    //       buttons: ['OK'],
    //       title: appName,
    //       message: message.checking
    //   });
    // })
    .on('update-available', function(e) {
        // 又有新版本了，app正在下载
        var downloadConfirmation = dialog.showMessageBox(mainWindow, {
            type: 'info',
            buttons: ['OK'],
            title: appName,
            message: message.updateAva
        });
        if (downloadConfirmation === 0) {
            return;
        }
    })
    .on('update-not-available', function(e) {
        // 已经是最新版本
        return dialog.showMessageBox(mainWindow, {
            type: 'info',
            buttons: ['OK'],
            title: appName,
            message: message.updateNotAva
        });
    })
    .on('update-downloaded',  function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        //新版本下载完成
        var index = dialog.showMessageBox(mainWindow, {
            type: 'info',
            buttons: ['现在重启','稍后重启'],
            title: appName,
            message: message.downloaded,
            detail: releaseName + "\n\n" + releaseNotes
        });
        if (index === 1) return;
        autoUpdater.quitAndInstall();
    });
    autoUpdater.checkForUpdates();
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ready)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on("certificate-error", (event, webContents, url, error, certificate, callback)=>{
  console.log("certificate-error:", url);
  // if(/cas/.test(url)){
    event.preventDefault();
    callback(true);
  // }else{
    // callback(false);
  // }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
