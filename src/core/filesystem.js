const fs = require('fs').promises;
const path = require('path');

const HOME_DIR = path.join(process.cwd(), 'NoOseb_Home');
const DOCUMENTS_DIR = path.join(HOME_DIR, 'documents');

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating directory ${dirPath}:`, error);
        }
    }
}

async function initializeHomeDirectory() {
    await ensureDirectoryExists(HOME_DIR);
    await ensureDirectoryExists(DOCUMENTS_DIR);
}

async function getFolderStructure(basePath) {
    try {
        const entries = await fs.readdir(basePath, { withFileTypes: true });
        return entries.map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? '📁' : '📄',
            path: path.relative(HOME_DIR, path.join(basePath, entry.name))
        }));
    } catch (error) {
        console.error('Error listing directory:', error);
        return [];
    }
}

module.exports = {
    HOME_DIR,
    DOCUMENTS_DIR,
    ensureDirectoryExists,
    initializeHomeDirectory,
    getFolderStructure
};