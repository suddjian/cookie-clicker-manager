const fs = require('fs');

const buildtimestamp = (new Date()).toLocaleString();
const script = fs.readFileSync('src/cookieclickermanager.js').toString();
const linecomments = /\/\/.*(?:\n|$)/gm;
const blockcomments = /\/\*(?:\*(?!\/)|[^*])*\*\//gs;
const cleanedscript = script
  .replace(linecomments, '\n')
  .replace(blockcomments, '\n')
  .replace(/^\s+/, '')
  .replace(/\s\s+/gm, ' ')
  .replace('\n', '')
  .replace('__BUILD_TIMESTAMP__', buildtimestamp);
const bookmarklet = 'javascript:' + encodeURIComponent(`(function(){${cleanedscript}})()`);

console.log(bookmarklet);
