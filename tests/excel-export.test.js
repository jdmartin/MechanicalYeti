import sqlite3 from "better-sqlite3";
import ExcelJS from "exceljs";
import fs from "fs";

// --- In-memory SQLite ---
const xmasdb = new sqlite3(":memory:");
const currentYear = new Date().getFullYear();

// --- Create table ---
xmasdb.prepare(`
  CREATE TABLE IF NOT EXISTS elves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    count INTEGER,
    notes TEXT,
    address TEXT,
    year INTEGER,
    recipients TEXT DEFAULT 'not given'
  )
`).run();

// --- Tools ---
class XmasTools {
    addElf(name, count, notes, address, recipient) {
        const exists = xmasdb
            .prepare("SELECT COUNT(*) AS count FROM elves WHERE name = ? AND year = ?")
            .pluck()
            .get(name, currentYear);

        if (exists > 0) {
            xmasdb
                .prepare("UPDATE elves SET count = ?, notes = ?, address = ?, recipients = ? WHERE name = ? AND year = ?")
                .run(count, notes, address, recipient, name, currentYear);
        } else {
            xmasdb
                .prepare("INSERT INTO elves(name, count, notes, address, year, recipients) VALUES (?,?,?,?,?,?)")
                .run(name, count, notes, address, currentYear, recipient);
        }
    }
}

class XmasDisplayTools {
    async export() {
        const rows = xmasdb.prepare("SELECT * FROM elves WHERE year = ?").all(currentYear);

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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`elves-${currentYear}`);

        // Headers
        const headerRow = worksheet.addRow(columnOrder.map(c => columnMapping[c]));
        headerRow.eachCell((cell, colNumber) => {
            const widths = [20,20,30,10,10,15,45,45];
            worksheet.getColumn(colNumber).width = widths[colNumber-1];
        });

        // Data rows
        rows.forEach(row => {
            if (row.address) row.address = row.address.replace(/\n/g, ", ");
            if (row.notes) row.notes = row.notes.replace(/\n/g, ", ");
            if (row.recipients) row.recipients = row.recipients.replace(/\n/g, ", ");

            if (row.count == null) row.count = "all";

            const newRow = { ...row, cust1: '', cust2: '', cust3: '' };
            const values = columnOrder.map(c => newRow[c]);
            worksheet.addRow(values);
        });

        // Return both buffer and ExcelJS attachment
        const buffer = await workbook.xlsx.writeBuffer();
        return { buffer };
    }
}

// --- Test ---
(async () => {
    const xmas = new XmasTools();
    const display = new XmasDisplayTools();

    // Insert tricky rows
    xmas.addElf("Robert'); DROP TABLE elves;--", 5, "Sneaky", "123 O'Malley Ln", "Bob");
    xmas.addElf("Normal Name", 3, "Testing --;", "House #42", "Sue");
    xmas.addElf(`Quotes "inside" and 'outside'`, 2, "Tricky \\n newline", "Somewhere far", "Ann");

    // Export Excel
    const result = await display.export();
    fs.writeFileSync("elves-test.xlsx", result.buffer);
    console.log("✅ Excel export created: elves-test.xlsx");

    // Verify DB still intact
    const allRows = xmasdb.prepare("SELECT * FROM elves").all();
    console.log("Database rows:");
    console.table(allRows);
})();

