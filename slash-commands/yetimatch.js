const { SlashCommandBuilder } = require("discord.js");

const xmas = require("../utils/xmasdb.js");
const xmasDBHelper = new xmas.XmasDisplayTools();

module.exports = {
    data: new SlashCommandBuilder().setName("yetimatch").setDescription("Let's match some friendly elves!"),

    async execute(interaction) {
        let matches = xmasDBHelper.matches();

        // Reply to the interaction with the embed and the Excel file as an attachment
        await interaction.reply({
            content: "Here's some suggested matches based on the elves' preferences:",
            embeds: [matches],
            ephemeral: true
        }).catch(error => {
            console.error(error);
        });
    },
};
