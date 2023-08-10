require("dotenv").config();
const fs = require("fs");

const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");

const myIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
];

const myPartials = [Partials.Channel, Partials.Message, Partials.Reaction];

const client = new Client({
    intents: myIntents,
    partials: myPartials,
});


const slashCommands = [];
const slashCommandFiles = fs
    .readdirSync(require("path").resolve(__dirname, "../slash-commands"))
    .filter((file) => file.endsWith(".js"));
client.slashCommands = new Collection();

class CreateCommandSet {
    generateSet() {
        for (const file of slashCommandFiles) {
            const command = require(`../slash-commands/${file}`);
            client.slashCommands.set(command.data.name, command);
        }
    }
}

module.exports = {
    client: client,
    slashCommands: slashCommands,
    slashCommandFiles: slashCommandFiles,
    CreateCommandSet,
};
