const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const sqlite3 = require("better-sqlite3");
const ExcelJS = require('exceljs');
const currentDate = new Date();
const currentYear = parseInt(currentDate.getFullYear());

//Other Tools
var SqlString = require("sqlstring");

let xmasdb = new sqlite3("./db/xmas.db");

class CreateXmasDatabase {
    startup() {
        var xmasDBPrep = xmasdb.prepare(
            "CREATE TABLE IF NOT EXISTS `elves` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `name` TEXT, `count` INTEGER, `notes` TEXT, `address` TEXT, year INTEGER)",
        );

        xmasDBPrep.run();
    }
}

class XmasTools {
    //Commands sanitize the input and add it to the DB.

    addElf(name, count, notes, address) {
        const selectElf = xmasdb.prepare("SELECT COUNT(*) AS count FROM elves WHERE name = ? AND year = ? LIMIT 1");
        var elfSelection = selectElf.pluck().get(name, currentYear);

        if (elfSelection > 0) {
            this.updateElfInDB(parseInt(count), name, SqlString.escape(notes), SqlString.escape(address));
        } else {
            this.addElfToDB(parseInt(count), name, SqlString.escape(notes), SqlString.escape(address));
        }
    }

    addElfToDB(count, name, notes, address) {
        const elfInsert = xmasdb.prepare("INSERT INTO elves(name, count, notes, address, year) VALUES (?,?,?,?,?)");
        elfInsert.run(name, count, notes, address, currentYear);
    }

    updateElfInDB(count, name, notes, address) {
        const elfUpdate = xmasdb.prepare("UPDATE elves SET count = ?, notes = ?, address = ? WHERE name = ? AND year = ?");
        elfUpdate.run(count, notes, address, name, currentYear);
    }
}

class XmasDisplayTools {
    async export() {
        const elfExport = xmasdb.prepare("SELECT * FROM elves");
        const rows = elfExport.all();

        // Create a new Excel workbook and worksheet
        const columnOrder = ['name', 'count', 'address', 'cust1', 'cust2', 'cust3', 'notes'];
        const columnMapping = {
            name: 'NAME',
            count: '# OF CARDS',
            notes: 'NOTES',
            address: 'ADDRESS',
            cust1: 'LIST SENT',
            cust2: 'LIST ACK',
            cust3: 'CARDS RECEIVED'
        };
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`elves-${currentYear}.xslx`);

        // Add headers to the worksheet
        const headerRow = worksheet.addRow(columnOrder.map(column => columnMapping[column]));
        // Set column widths (adjust values as needed)
        headerRow.eachCell((cell, colNumber) => {
            const columnWidths = [20, 20, 30, 10, 10, 15, 45]; // Example widths
            const columnIndex = colNumber - 1; // ExcelJS is 1-based index, array is 0-based
            worksheet.getColumn(colNumber).width = columnWidths[columnIndex];
        });

        // Add data rows to the worksheet
        rows.forEach(row => {
            // Replace newline characters with ', ' in the address and notes fields
            row.address = row.address.replace(/\\n/g, ', ');
            row.address = row.address.replace(/\\'/g, '\'');
            row.address = row.address.slice(1, -1);

            row.notes = row.notes.replace(/\\n/g, ', ');
            row.notes = row.notes.replace(/\\'/g, '\'');
            row.notes = row.notes.slice(1, -1);

            // If count is 'null', then we probably have a case where the person chose 'all'
            if (row.count == null) {
                row.count = "all (should verify)";
            }

            // Create an object representing the row with custom values
            const newRow = {
                ...row,
                cust1: '', // Add custom value for cust1
                cust2: '', // Add custom value for cust2
                cust3: ''  // Add custom value for cust3
            };

            // Map values to columns based on columnOrder
            const values = columnOrder.map(column => newRow[column]);
            worksheet.addRow(values);
        });

        // Save the Excel file to a buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Create a Discord.js attachment
        const attachmentBuilder = new AttachmentBuilder(buffer, { name: `elves-${currentYear}.xlsx` });

        // Return both the attachment and buffer
        return {
            attachment: attachmentBuilder,
        };
    }

    show() {
        const elvesEmbed = new EmbedBuilder().setColor(0xffffff).setTitle("🧝‍♀️ Good Little Elves 🧝").setFooter({
            text: "RAAR! (Notes and Addresses in attached spreadsheet) Use this information wisely.",
        });
        const sendingToEveryone = [];

        // Create a comma-separated list of names
        let allMatchValue = sendingToEveryone.join(' **|** ');
        var elfSql = xmasdb.prepare("SELECT * FROM elves WHERE year = ? ORDER BY name ASC");
        var elfResults = elfSql.all(currentYear);
        if (elfResults.length > 0) {
            elfResults.forEach((row) => {
                let theCount = row.count;
                if (theCount == null) {
                    theCount = "all"
                    sendingToEveryone.push(row.name);
                }

                //Make this embed a little more concise
                let theElfValue = "Number of Cards: " + theCount;

                if (row.notes.trim() !== "''" && row.notes.length > 0) {
                    theElfValue = "Number of Cards: " + theCount + "\nNotes: " + row.notes;
                }

                if (theCount !== "all") {
                    elvesEmbed.addFields({
                        name: `__${row.name}__`,
                        value: theElfValue,
                        inline: false,
                    });
                }
            });
            // Sort the sendingToEveryone array
            sendingToEveryone.sort();
            // Create a list
            let formattedList = "";
            sendingToEveryone.forEach((item, index) => {
                formattedList += (index + 1) + ". " + item + "\n";
            });
            // Add the list of people sending to all
            elvesEmbed.addFields({
                name: "__Sending to Everyone:__",
                value: formattedList
            });
        } else {
            elvesEmbed.addFields({
                name: "No one of consequence!",
                value: "No elves, yet!  Looks like everyone's getting coal...",
                inline: false,
            });
        }

        return elvesEmbed;
    }

    stats() {
        // Get something to replace 'all' in the count
        var numberWhoChoseAll = xmasdb.prepare("SELECT COUNT(*) name FROM elves WHERE count IS NULL AND year = ?;");
        var numberWhoChoseAllResults = numberWhoChoseAll.all(currentYear);

        var allElfCount = xmasdb.prepare("SELECT COUNT(*) name FROM elves WHERE year = ?;");
        var allElfCountResults = allElfCount.all(currentYear);

        var actualNumberCardsWherePeopleChoseAll = (numberWhoChoseAllResults[0].name - 1) * allElfCountResults[0].name;

        var cardTotal = xmasdb.prepare("SELECT SUM(count) FROM elves WHERE year = ?");
        var cardTotalResults = cardTotal.pluck().get(currentYear) + actualNumberCardsWherePeopleChoseAll;

        // People may have offered to send more than needed
        var expectedCardMax = (allElfCountResults[0].name * (allElfCountResults[0].name - 1));

        const elfStatsEmbed = new EmbedBuilder().setColor(0xffffff).setTitle("🧝‍♀️ Happy Little Stats 🧝").setFooter({ text: "Includes (Elves who chose 'all' - 1 (because self)) * Total Elves" });

        if (cardTotalResults > 0) {
            let actualCardCount = cardTotalResults.toString();

            if (cardTotalResults > expectedCardMax) {
                actualCardCount = expectedCardMax.toString();
            }

            elfStatsEmbed.addFields({
                name: `Maximum Possible Per Person:`,
                value: (expectedCardMax / allElfCountResults[0].name).toString(),
                inline: false,
            })

            elfStatsEmbed.addFields({
                name: `Current Number of Expected Cards for ${currentYear.toString()}:`,
                value: actualCardCount,
                inline: false,
            });
        } else {
            elfStatsEmbed.addFields({
                name: "Saddest Number of Cards:",
                value: "0",
                inline: false,
            });
        }

        return elfStatsEmbed;
    }

    matches() {
        const elfMatchesEmbed = new EmbedBuilder().setColor(0xffffff).setTitle("🧝‍♀️ Suggested Matches 🧝");

        // Step 1: Retrieve preferences for this year
        const preferencesQuery = xmasdb.prepare("SELECT name, count FROM elves WHERE year = ?;");
        const preferencesResults = preferencesQuery.all(currentYear);

        // Create an array of names
        const allNames = preferencesResults.map(person => person.name);

        // Step 2: Set count to total names - 1 for those with null count
        // Also, identify those people who are sending to all.
        const sendingToEveryone = [];

        for (let person of preferencesResults) {
            if (person.count === null) {
                person.count = allNames.length - 1;
                sendingToEveryone.push(person.name);
            }
        }

        // Sort the sendingToEveryone array
        sendingToEveryone.sort();
        // Create a list
        let formattedList = "";
        sendingToEveryone.forEach((item, index) => {
            formattedList += (index + 1) + ": " + item + "\n";
        });

        //Add a bit of space.
        elfMatchesEmbed.addFields({
            name: "   ",
            value: "   "
        });

        //Add the list of people sending to all
        elfMatchesEmbed.addFields({
            name: "__Sending to Everyone:__",
            value: formattedList
        });

        // Step 3 and 4: Create matches and print the list of names
        for (let person of preferencesResults) {
            let count = person.count;
            const availableNames = allNames.filter(name => name !== person.name);

            const matches = [];
            while (count > 0 && availableNames.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableNames.length);
                const match = availableNames[randomIndex];
                matches.push(match);
                availableNames.splice(randomIndex, 1);
                count--;
            }
            matches.sort()

            //Process people who aren't sending to all and add to embed
            if (!sendingToEveryone.includes(person.name)) {
                // Create a formatted list with numbering
                const formattedMatches = matches.map((match, index) => `${index + 1}: ${match}`).join('\n');
                elfMatchesEmbed.addFields({
                    name: `__For ${person.name}:__`,
                    value: formattedMatches
                });
            }
        }

        return elfMatchesEmbed;
    }
}

module.exports = {
    XmasTools,
    CreateXmasDatabase,
    XmasDisplayTools,
};
