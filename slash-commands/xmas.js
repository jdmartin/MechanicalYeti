import { ActionRowBuilder, DiscordAPIError, EmbedBuilder, MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { XmasTools } from "../utils/xmasdb.js";
const xmas = new XmasTools();

export const data = new SlashCommandBuilder().setName("xmas").setDescription("Christmas Cards");
export async function execute(interaction) {
    if (process.env.xmas_deadline_passed === "false") {
        const uniqueCustomId = `xmasModal_${interaction.user.id}_${Date.now()}`;
        const modal = new ModalBuilder().setCustomId(uniqueCustomId).setTitle("Christmas Card Swap!");

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

        const xmasRecipientsInput = new TextInputBuilder()
            .setCustomId("xmasRecipientsInput")
            .setLabel("What name(s) should we send to?")
            .setPlaceholder("Ex: 'Evie' or 'Gilly & Moxie'")
            .setStyle(TextInputStyle.Short)
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
        const countActionRow = new ActionRowBuilder().addComponents(xmasCardsCountInput);
        const notesActionRow = new ActionRowBuilder().addComponents(xmasNotesInput);
        const addressActionRow = new ActionRowBuilder().addComponents(xmasAddressInput);
        const recipientActionRow = new ActionRowBuilder().addComponents(xmasRecipientsInput);

        // Add inputs to the modal
        modal.addComponents(countActionRow, recipientActionRow, addressActionRow, notesActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);

        try {
            const filter = (i) => i.customId === uniqueCustomId;
            const collectedInteraction = await interaction.awaitModalSubmit({ filter, time: 300000 });

            if (collectedInteraction) {
                const xmasCardsCount = collectedInteraction.fields.getTextInputValue("xmasCardsCountInput");
                const xmasNotes = collectedInteraction.fields.getTextInputValue("xmasNotesInput");
                const xmasAddress = collectedInteraction.fields.getTextInputValue("xmasAddressInput");
                const xmasRecipients = collectedInteraction.fields.getTextInputValue("xmasRecipientsInput");

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

                xmas.addElf(theName, xmasCardsCount, xmasNotes, processedAddress, xmasRecipients);

                let cardCountMessage = "";

                if (xmasCardsCount.toLowerCase() === 'all') {
                    cardCountMessage = "all the";
                } else {
                    cardCountMessage = xmasCardsCount;
                }

                let xmas_response = `
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
                    flags: MessageFlags.Ephemeral
                });

                await interaction.user.send({
                    content: xmas_response
                });
            }
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === 10062) {
                console.log("User likely didn't finish. Caught 'Unknown Interaction' error.");
            }
            else if (error.code === 'InteractionAlreadyReplied') {
                console.log(`${interaction.user.tag} already replied.`);
            }
            else if (error.code === 'InteractionCollectorError') {
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
            flags: MessageFlags.Ephemeral
        }).catch(error => {
            console.error(error);
        });
    }
}