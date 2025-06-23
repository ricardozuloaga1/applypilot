"use strict";
// Utility functions for AutoApply AI
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.generateId = generateId;
exports.formatDate = formatDate;
exports.sanitizeFileName = sanitizeFileName;
exports.createFolderName = createFolderName;
exports.extractDriveFileId = extractDriveFileId;
exports.extractSheetsId = extractSheetsId;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
function sanitizeFileName(fileName) {
    return fileName
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}
function createFolderName(company, jobTitle) {
    return "".concat(company, " - ").concat(jobTitle).replace(/[<>:"/\\|?*]/g, '');
}
function extractDriveFileId(url) {
    var match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}
function extractSheetsId(url) {
    var match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}
