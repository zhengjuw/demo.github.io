
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInSubFrames: true
        },
        icon: path.join(__dirname, 'icon.ico')
    });

    const startURL = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startURL);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 读取CSV文件内容
ipcMain.handle('load-csv-data', async (event) => {
    try {
        const csvPath = path.join(__dirname, 'data.csv');
        if (fs.existsSync(csvPath)) {
            const data = fs.readFileSync(csvPath, 'utf8');
            return { success: true, data: data }
        } else {
            return { success: true, data: '' }
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});