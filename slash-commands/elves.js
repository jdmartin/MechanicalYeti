const { MessageFlags, SlashCommandBuilder } = require("discord.js");

const xmas = require("../utils/xmasdb.js");
const xmasDBHelper = new xmas.XmasDisplayTools();

module.exports = {
    data: new SlashCommandBuilder().setName("elves").setDescription("Show a list of friendly elves."),

    async execute(interaction) {
        let response = xmasDBHelper.show();
        let stats = xmasDBHelper.stats();
        // Export the Excel file and get the attachment and buffer
        const { attachment } = await xmasDBHelper.export();

        // Reply to the interaction with the embed and the Excel file as an attachment
        await interaction.reply({
            content: "Here's the elf information and the Excel file attachment:",
            embeds: [response, stats],
            files: [attachment],
            flags: MessageFlags.Ephemeral
        }).catch(error => {
            console.error(error);
        });
    },
};
