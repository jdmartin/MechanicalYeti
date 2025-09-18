import { MessageFlags, SlashCommandBuilder } from "discord.js";

import { XmasDisplayTools } from "../utils/xmasdb.js";
const xmasDBHelper = new XmasDisplayTools();

export const data = new SlashCommandBuilder().setName("yetimatch").setDescription("Let's match some friendly elves!");
export async function execute(interaction) {
    let matches = xmasDBHelper.matches();

    // Reply to the interaction with the embed and the Excel file as an attachment
    await interaction.reply({
        content: "Here's some suggested matches based on the elves' preferences:",
        embeds: [matches],
        flags: MessageFlags.Ephemeral
    }).catch(error => {
        console.error(error);
    });
}
