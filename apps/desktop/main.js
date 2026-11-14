const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'PocketBridge Desktop Companion',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const page = app.isPackaged ? 'dist/index.html' : 'index.html';
  win.loadFile(path.join(__dirname, page));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
