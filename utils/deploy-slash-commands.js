import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandFiles = readdirSync(path.resolve(__dirname, "../slash-commands")).filter((file) => {
    if (process.env.enable_xmas === "false" && (file === "xmas.js" || file === "elves.js")) {
        return false; // Exclude the files if enable_xmas is false
    }
    return file.endsWith(".js");
});

for (const file of commandFiles) {
    const filePath = path.resolve(__dirname, `../slash-commands/${file}`);
    const commandModule = await import(pathToFileURL(filePath).href);
    const command = commandModule.default ?? commandModule; // handle default vs named export
    commands.push(command.data.toJSON());
}

class DeploySlashCommands {
    constructor() {
        this.clientID = process.env.client_id;
        this.guildID = process.env.guild_id;
        this.rest = new REST({ version: "9" }).setToken(`${process.env.BOT_TOKEN}`);
    }
    begin() {
        (async () => {
            try {
                console.log("Started refreshing application (/) commands.");

                await this.rest.put(Routes.applicationGuildCommands(this.clientID, this.guildID), { body: commands });

                console.log("Successfully reloaded application (/) commands.");
            } catch (error) {
                console.error(error);
            }
        })();
    }
}

export { DeploySlashCommands };
