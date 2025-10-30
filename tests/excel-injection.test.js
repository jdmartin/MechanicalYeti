import Database from "better-sqlite3";
import ExcelJS from "exceljs";

const DB_PATH = "./db/xmas-test.db";
const currentYear = new Date().getFullYear();

const db = new Database(DB_PATH);
db.prepare(`DROP TABLE IF EXISTS elves`).run();
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

// --- Export to Excel ---
async function exportElves() {
    const rows = db.prepare("SELECT * FROM elves WHERE year = ?").all(currentYear);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`elves-${currentYear}`);

    const columnOrder = ['name', 'count', 'address', 'cust1', 'cust2', 'cust3', 'notes', 'recipients'];
    const columnMapping = {
        name: 'NAME',
        count: '# OF CARDS',
        notes: 'NOTES',
        address: 'ADDRESS',
        cust1: 'LIST SENT',
        cust2: 'LIST ACK',
        cust3: 'CARDS RECEIVED',
        recipients: 'RECIPIENT NAME(S)'
    };

    // headers
    worksheet.addRow(columnOrder.map(col => columnMapping[col]));

    // data rows
    rows.forEach(row => {
        const newRow = {
            ...row,
            cust1: '',
            cust2: '',
            cust3: ''
        };
        const values = columnOrder.map(col => newRow[col]);
        worksheet.addRow(values);
    });

    // return the workbook in memory
    return workbook;
}

// --- Read back Excel and log ---
async function readBackWorkbook(workbook) {
    const worksheet = workbook.worksheets[0];
    console.log("\n🧝  Excel export preview:\n");
    worksheet.eachRow((row, rowNumber) => {
        const rowValues = row.values.slice(1); // ExcelJS 1-based index
        console.log(rowNumber === 1 ? "Headers:" : `Row ${rowNumber - 1}:`, rowValues);
    });
}

(async () => {
    const workbook = await exportElves();
    await readBackWorkbook(workbook);

    // --- Optional sanity: check DB table still exists ---
    try {
        const count = db.prepare("SELECT COUNT(*) FROM elves").pluck().get();
        console.log(`\n✅ Table still exists! ${count} rows found.`);
    } catch (e) {
        console.error("\n❌ Table missing — possible injection vulnerability!");
    }
})();

