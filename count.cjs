const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const divOpen = (content.match(/<div/g) || []).length;
const divClose = (content.match(/<\/div>/g) || []).length;

console.log('divOpen:', divOpen);
console.log('divClose:', divClose);
