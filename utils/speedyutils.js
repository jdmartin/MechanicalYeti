
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

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

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const slashCommands = [];
const slashCommandFiles = readdirSync(
    resolve(__dirname, "../slash-commands")
).filter((file) => file.endsWith(".js"));
client.slashCommands = new Collection();

class CreateCommandSet {
    async generateSet() {
        client.slashCommands = new Map();

        const commandsPath = join(process.cwd(), 'slash-commands');
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = await import(filePath);

            if (!command.data || !command.execute) {
                console.warn(`[WARNING] Command at ${file} missing data or execute.`);
                continue;
            }

            client.slashCommands.set(command.data.name, command);
        }

        console.log(`Loaded ${client.slashCommands.size} commands.`);
    }
}

export { client, CreateCommandSet, slashCommands, slashCommandFiles }
