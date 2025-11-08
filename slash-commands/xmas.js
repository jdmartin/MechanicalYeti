import { ActionRowBuilder, DiscordAPIError, EmbedBuilder, MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { XmasTools } from "../utils/xmasdb.js";
const xmas = new XmasTools();

// optional: track any open collectors per user
const activeModalCollectors = new Map();

export const data = new SlashCommandBuilder().setName("xmas").setDescription("Christmas Cards");
export async function execute(interaction) {
    if (process.env.xmas_deadline_passed === "false") {
        // stable modal ID per guild + user
        const modalCustomId = `xmasModal_${interaction.guildId}_${interaction.user.id}`;

        const modal = new ModalBuilder().setCustomId(modalCustomId).setTitle("Christmas Card Swap!");

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
            .setPlaceholder("Ex: 'Evie & Gnome' or 'Speedy'")
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

        // assign a unique token for this modal attempt
        const currentToken = Symbol();
        activeModalCollectors.set(interaction.user.id, currentToken);

        // Wait for modal submission
        const collectorPromise = interaction.awaitModalSubmit({
            filter: (i) => i.customId === modalCustomId && i.user.id === interaction.user.id,
            time: 300000, // 5 minutes
        });

        try {
            const collectedInteraction = await collectorPromise;

            // only proceed if this is still the latest modal for this user
            if (activeModalCollectors.get(interaction.user.id) !== currentToken) return;
            activeModalCollectors.delete(interaction.user.id);

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

                let xmas_response =
                    `${process.env.xmas_message}\n` +
                    `${process.env.xmas_blankline}\n` +
                    `\t${process.env.xmas_name}\n` +
                    `\t${process.env.xmas_street}\n` +
                    `\t${process.env.xmas_town}\n` +
                    `\t${process.env.xmas_country}\n` +
                    `${process.env.xmas_blankline}\n` +
                    `Reminder: I've got you down for ${cardCountMessage} cards.\n\n` +
                    `${process.env.xmas_instructions}`;

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
            // only handle if this is still the latest modal for this user
            if (activeModalCollectors.get(interaction.user.id) !== currentToken) return;
            activeModalCollectors.delete(interaction.user.id);

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
