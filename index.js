//Load helper files
import { ActivityType, InteractionType, MessageFlags } from "discord.js";
import { CreateXmasDatabase } from "./utils/xmasdb.js";
import { client, CreateCommandSet } from "./utils/speedyutils.js";
import { DeploySlashCommands } from "./utils/deploy-slash-commands.js";
import { Heartbeat } from "./utils/heartbeat.js";

//Load commands into array
const speedyutils = new CreateCommandSet();
speedyutils.generateSet();
const slashutils = new DeploySlashCommands();
slashutils.begin();

//Initialize the xmas database:
if (process.env.enable_xmas === "true") {
    const xmas = new CreateXmasDatabase();
    xmas.startup();
}

//Once that's done, let's move on to main.
client.once("clientReady", () => {
    // prints "Ready!" to the console once the bot is online
    client.user.setActivity("RAAAAAAR!", { type: ActivityType.Custom });

    //Start the heartbeat
    const heartbeat = new Heartbeat();
    if (process.env.heart_type === 'push') {
        heartbeat.startPushing();
    } else if (process.env.heart_type === 'socket') {
        heartbeat.startSocket();
    }
});

//Handle slash commands, which are 'interactions'
client.on("interactionCreate", async (interaction) => {
    if (!interaction.type === InteractionType.ApplicationCommand) return;

    const command = client.slashCommands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral });
    }
});

client.login(process.env.BOT_TOKEN);
