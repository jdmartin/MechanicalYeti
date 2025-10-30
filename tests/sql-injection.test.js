import Database from "better-sqlite3";
import fs from "fs";

const DB_PATH = "./db/xmas-test.db";
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH); // start clean

const db = new Database(DB_PATH);
const currentYear = new Date().getFullYear();

// --- Create table ---
db.prepare(`
CREATE TABLE IF NOT EXISTS elves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    count INTEGER,
    notes TEXT,
    address TEXT,
    year INTEGER,
    recipients TEXT
)
`).run();

// --- Helper to add a record safely ---
function addElf(name, count, notes, address, recipient) {
    const stmt = db.prepare("INSERT INTO elves(name, count, notes, address, year, recipients) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(name, count, notes, address, currentYear, recipient);
}

// --- Injection-style test data ---
const testData = [
    ["Robert'); DROP TABLE elves;--", 5, "Sneaky", "123 O'Malley Ln", "Bob"],
    ["Normal Name", 3, "Testing --;", "House #42", "Sue"],
    ["Quotes \"inside\" and 'outside'", 2, "Tricky \\n newline", "Somewhere far", "Ann"]
];

// --- Insert test data ---
for (const [name, count, notes, address, recipient] of testData) {
    addElf(name, count, notes, address, recipient);
}

// --- Read back data ---
const rows = db.prepare("SELECT * FROM elves WHERE year = ?").all(currentYear);
console.log("\n🧝  Stored elves:\n");
console.table(rows);

// --- Sanity check: confirm the table still exists ---
try {
    const count = db.prepare("SELECT COUNT(*) FROM elves").pluck().get();
    console.log(`\n✅ Table still exists! ${count} rows found.`);
} catch (e) {
    console.error("\n❌ Table missing — possible injection vulnerability!");
}

