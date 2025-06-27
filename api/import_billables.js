const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Database location relative to this script
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Ensure Billables table exists in case the database is new
// Schema matches the application usage
db.exec(`
  CREATE TABLE IF NOT EXISTS Billables (
    BillableCode TEXT PRIMARY KEY,
    Description TEXT NOT NULL,
    Cost REAL NOT NULL
  )
`);

// JSON file path provided as first argument, defaults to billables.json
const jsonFile = process.argv[2] || path.join(__dirname, 'billables.json');

if (!fs.existsSync(jsonFile)) {
  console.error(`File not found: ${jsonFile}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const insert = db.prepare(
  `INSERT OR REPLACE INTO Billables (BillableCode, Description, Cost)
   VALUES (?, ?, ?)`
);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    const code = row['Procedure Code'] || row.BillableCode;
    const description = row['Description'] || row['Abbrev Description'] || '';
    const price = row.Price || row.Cost || 0;
    const cost = typeof price === 'string'
      ? parseFloat(price.replace(/[$,]/g, ''))
      : Number(price);

    if (!code) continue; // skip rows without a code
    insert.run(code, description, cost);
  }
});

insertMany(data);
console.log(`Imported ${data.length} records from ${jsonFile}`);
