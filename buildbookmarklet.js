const fs = require('fs');

const script = fs.readFileSync('cookieclickermanager.js').toString();
const linecomments = /\/\/.*(?:\n|$)/gm;
const blockcomments = /\/\*(?:\*(?!\/)|[^*])*\*\//gs;
const cleanedscript = script
  .replace(linecomments, '\n')
  .replace(blockcomments, '\n')
  .replace(/^\s+/, '')
  .replace(/\s\s+/gm, ' ');
const bookmarklet = 'javascript:' + encodeURIComponent(`(function(){${cleanedscript}})()`);

console.log(bookmarklet);
