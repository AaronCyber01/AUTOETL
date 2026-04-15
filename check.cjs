const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

let stack = [];
let i = 0;
while (i < content.length) {
  if (content[i] === '<') {
    if (content[i+1] === '/') {
      let j = i + 2;
      while (content[j] !== '>') j++;
      let tag = content.substring(i+2, j).trim();
      let last = stack.pop();
      if (last !== tag) {
        console.log(`Mismatch: expected ${last}, got ${tag} at index ${i}`);
        console.log(content.substring(i-50, i+50));
        break;
      }
      i = j + 1;
    } else {
      let j = i + 1;
      let tagName = '';
      while (j < content.length && /[a-zA-Z0-9]/.test(content[j])) {
        tagName += content[j];
        j++;
      }
      if (tagName) {
        let k = j;
        let isSelfClosing = false;
        while (k < content.length && content[k] !== '>') {
          if (content[k] === '/' && content[k+1] === '>') {
            isSelfClosing = true;
            k++;
            break;
          }
          k++;
        }
        if (!isSelfClosing) {
          stack.push(tagName);
        }
        i = k + 1;
      } else {
        i++;
      }
    }
  } else {
    i++;
  }
}
console.log('Remaining in stack:', stack);
