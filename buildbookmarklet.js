const fs = require('fs');

const script = fs.readFileSync('cookieclickermanager.js').toString();

const cleanedscript = script.replace(/\/\/.*(\n|$)/, "$1").replace(/\/\*(?:\*(?!\/)|[^*])*\*\//gs, " ").replace(/\n\n+/, '\n');

const bookmarklet = 'javascript:' + encodeURIComponent(`(function(){${cleanedscript}})`);

console.log(bookmarklet);
