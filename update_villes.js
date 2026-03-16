const fs = require('fs');
const communes = require('./communes_ci.json');
const pagePath = 'apps/web/src/app/dashboard/admin/syndicats/page.tsx';
let content = fs.readFileSync(pagePath, 'utf-8');

const regex = /const VILLES_CI = \[[\s\S]*?\];/;
const arrayStr = JSON.stringify(communes, null, 4).replace(/"/g, "'").replace(/'nom': /g, 'nom: ').replace(/'region': /g, 'region: ').replace(/'code': /g, 'code: ');
const newArray = 'const VILLES_CI = ' + arrayStr + ';';

content = content.replace(regex, newArray);
fs.writeFileSync(pagePath, content);
console.log('Replaced VILLES_CI array with ' + communes.length + ' communes.');
