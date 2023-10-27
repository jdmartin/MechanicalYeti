const { ActionRowBuilder, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const xmasutils = require("../utils/xmasdb.js");
const xmas = new xmasutils.XmasTools();

module.exports = {
    data: new SlashCommandBuilder().setName("xmas").setDescription("Christmas Cards"),

    async execute(interaction) {
        if (process.env.xmas_deadline_passed === "false") {
            const modal = new ModalBuilder().setCustomId("xmasModal").setTitle("Christmas Card Swap!");

            // Create the text input components
            const xmasCardsCountInput = new TextInputBuilder()
                .setCustomId("xmasCardsCountInput")
                // The label is the prompt the user sees for this input
                .setLabel("How many cards would you like to send?")
                // Set placeholder
                .setPlaceholder("Enter a number or 'all'")
                // At least 1 digit, not more than 3.
                .setMinLength(1)
                .setMaxLength(3)
                // Short means only a single line of text
                .setStyle(TextInputStyle.Short)
                // This is a required value
                .setRequired(true);

            const xmasNotesInput = new TextInputBuilder()
                .setCustomId("xmasNotesInput")
                .setLabel("Anything we should know?")
                .setPlaceholder("You can put a note to Leisa here...")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const xmasAddressInput = new TextInputBuilder()
                .setCustomId("xmasAddressInput")
                .setLabel("Address (only visible to Leisa and Evie!):")
                .setPlaceholder("Required to get cards. If you plan to provide this some other way, please indicate that.")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            // An action row only holds one text input,
            // so you need one action row per text input.
            const firstActionRow = new ActionRowBuilder().addComponents(xmasCardsCountInput);
            const secondActionRow = new ActionRowBuilder().addComponents(xmasNotesInput);
            const thirdActionRow = new ActionRowBuilder().addComponents(xmasAddressInput);

            // Add inputs to the modal
            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

            // Show the modal to the user
            await interaction.showModal(modal);

            try {
                const filter = (interaction) => interaction.customId === 'xmasModal';
                const collectedInteraction = await interaction.awaitModalSubmit({ filter, time: 300000 });

                if (collectedInteraction) {
                    const xmasCardsCount = collectedInteraction.fields.getTextInputValue("xmasCardsCountInput");
                    const xmasNotes = collectedInteraction.fields.getTextInputValue("xmasNotesInput");
                    const xmasAddress = collectedInteraction.fields.getTextInputValue("xmasAddressInput");
                    var processedAddress = "";
                    if (xmasAddress.length == 0) {
                        processedAddress = "On File";
                    } else {
                        processedAddress = xmasAddress;
                    }

                    let theName = "";
                    if (collectedInteraction.member.nickname != null) {
                        theName = collectedInteraction.member.nickname;
                    } else {
                        theName = collectedInteraction.user.username;
                    }

                    xmas.addElf(theName, xmasCardsCount, xmasNotes, processedAddress);

                    let cardCountMessage = "";

                    if (xmasCardsCount.toLowerCase() === 'all') {
                        cardCountMessage = "all the";
                    } else {
                        cardCountMessage = xmasCardsCount;
                    }

                    xmas_response = `
                    ${process.env.xmas_message}
                    ${process.env.xmas_blankline}
                    ${process.env.xmas_name}
                    ${process.env.xmas_street}
                    ${process.env.xmas_town}
                    ${process.env.xmas_country}
                    ${process.env.xmas_blankline}
                    Reminder: I've got you down for ${cardCountMessage} cards.
        
                    ${process.env.xmas_instructions}
                    `;
                    console.log(`${theName} will send ${cardCountMessage} cards. They added: ${xmasNotes}`);

                    await collectedInteraction.reply({
                        content: xmas_response,
                        ephemeral: true,
                    });

                    await interaction.user.send({
                        content: xmas_response
                    });
                }
            } catch (error) {
                if (error.code === 'InteractionCollectorError') {
                    console.log(`${interaction.user.tag} timed out.`);
                } else {
                    console.error(error);
                }
            }
        } else {
            const elvesEmbed = new EmbedBuilder().setColor(0xffffff).setTitle("RAAAR!!!");
            let lateNotice = `

            Hey, you're late!  But hope isn't lost (maybe)!

            Send a message to **Leisa** or **Evie** to see if we can fit you in.
            
            🎄
            `;
            elvesEmbed.addFields({
                name: " ",
                value: lateNotice,
                inline: false,
            });

            await interaction.reply({
                embeds: [elvesEmbed],
                ephemeral: true
            }).catch(error => {
                console.error(error);
            });
        }
    }
};