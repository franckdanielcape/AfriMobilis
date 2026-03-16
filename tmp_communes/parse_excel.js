const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const excelFile = path.join(__dirname, 'LISTE DES CIRCONSCRIPTIONS ADMINISTRATIVES ET DES COMMUNES.xlsx');

try {
    const workbook = xlsx.readFile(excelFile);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Parse as JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    // Assuming data is an array of arrays representing rows

    // Let's just output the first few rows to see the structure and the headers
    console.log("Structure extracted from Excel:");
    for (let i = 0; i < Math.min(10, data.length); i++) {
        console.log(data[i]);
    }

    // Also save the full raw JSON
    fs.writeFileSync(path.join(__dirname, 'raw_excel.json'), JSON.stringify(data, null, 2));
    console.log(`Saved raw JSON with ${data.length} rows.`);

} catch (e) {
    console.error("Error reading file:", e);
}
