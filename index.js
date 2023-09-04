//Load helper files
const utils = require("./utils/speedyutils.js");
const slash = require("./utils/deploy-slash-commands");
const heart = require("./utils/heartbeat.js");
const { ActivityType, InteractionType } = require("discord.js");

//Get some essential variables from the helper files:
const client = utils.client;

//Load commands into array
const speedyutils = new utils.CreateCommandSet();
speedyutils.generateSet();
const slashutils = new slash.DeploySlashCommands();
slashutils.begin();

//Initialize the xmas database:
if (process.env.enable_xmas === "true") {
    const xmasdb = require("./utils/xmasdb.js");
    const xmas = new xmasdb.CreateXmasDatabase();
    xmas.startup();
}

//Once that's done, let's move on to main.
client.once("ready", () => {
    // prints "Ready!" to the console once the bot is online
    client.user.setActivity("RAAAAAAR!", { type: ActivityType.Custom });

    //Start the heartbeat
    const heartbeat = new heart.Heartbeat();
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
        return interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
});

client.login(process.env.BOT_TOKEN);
