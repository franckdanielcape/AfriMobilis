const fs = require('fs');
const path = require('path');

const rawData = require('./raw_excel.json');

// Skip the header row
const rows = rawData.slice(1);

const communes = [];

for (const row of rows) {
    const region = row[0];
    const communeName = row[4];

    if (communeName && typeof communeName === 'string' && communeName.trim() !== '') {
        const nom = communeName.trim();
        // Capitalize region name nicely
        const formatRegion = (r) => {
            if (!r) return "Inconnue";
            return r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        };

        const code = nom.substring(0, 3).toUpperCase().padEnd(3, 'X');

        communes.push({
            nom: nom,
            region: formatRegion(region),
            code: code
        });
    }
}

// Ensure unique by name
const uniqueMap = new Map();
for (const c of communes) {
    if (!uniqueMap.has(c.nom.toLowerCase())) {
        uniqueMap.set(c.nom.toLowerCase(), c);
    }
}

const finalCommunes = Array.from(uniqueMap.values());
finalCommunes.sort((a, b) => a.nom.localeCompare(b.nom));

console.log(`Found ${finalCommunes.length} communes from the official file.`);

const outputDest = path.join(__dirname, 'official_communes.json');
fs.writeFileSync(outputDest, JSON.stringify(finalCommunes, null, 4));
console.log('Saved formatted communes to', outputDest);

// Fix correct page path (only one '..' since we're in tmp_communes)
const pagePath = path.resolve(__dirname, '../apps/web/src/app/dashboard/admin/syndicats/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf-8');

const regex = /const VILLES_CI = \[[\s\S]*?\];/;

const betterArrayStr = JSON.stringify(finalCommunes, null, 4)
    .replace(/\"nom\": \"(.*?)\"/g, (match, p1) => `nom: '${p1.replace(/'/g, "\\'")}'`)
    .replace(/\"region\": \"(.*?)\"/g, (match, p1) => `region: '${p1.replace(/'/g, "\\'")}'`)
    .replace(/\"code\": \"(.*?)\"/g, (match, p1) => `code: '${p1.replace(/'/g, "\\'")}'`);

const newVillesDef = 'const VILLES_CI = ' + betterArrayStr.replace(/"/g, "'") + ';';

pageContent = pageContent.replace(regex, newVillesDef);
fs.writeFileSync(pagePath, pageContent, 'utf-8');
console.log('Successfully injected into page.tsx!');
