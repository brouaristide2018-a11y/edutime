const fs = require('fs');
const path = './src/pages/Settings.tsx';

let content = fs.readFileSync(path, 'utf8');
content = content.replace(/localSettings/g, 'settings');
content = content.replace(/setLocalSettings/g, 'updateSettings');

fs.writeFileSync(path, content);
console.log('Replaced localSettings with settings');
