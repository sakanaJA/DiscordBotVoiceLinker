const { Client, Intents, Permissions, MessageEmbed, Collection } = require('discord.js');
const { readdirSync } = require('fs');

// Discordクライアントの設定
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
    disableMentions: 'everyone',
});

// コンフィグファイルの読み込み
client.config = require('./config');

// コマンドの読み込み
client.commands = new Collection();
readdirSync('./commands/').forEach(dirs => {
    const commands = readdirSync(`./commands/${dirs}`).filter(files => files.endsWith('.js'));
    for (const file of commands) {
        const command = require(`./commands/${dirs}/${file}`);
        client.commands.set(command.name.toLowerCase(), command);
    };
});

// メッセージ削除機能
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if someone joins a VC (old channel is null)
    if(oldState.channelID === null && newState.channelID !== null) {
        // Create or fetch the chat room for this VC
        let chatRoom = await getOrCreateChatRoomForVC(newState.channel);

        // Update permissions for the chat room
        await updateChatRoomPermissions(chatRoom, newState.channel);
    }

    // Check if someone leaves a VC (new channel is null)
    if(newState.channelID === null && oldState.channelID !== null) {
        let chatRoom = await getChatRoomForVC(oldState.channel);

        if (chatRoom) {
            // Update permissions for the chat room
            await updateChatRoomPermissions(chatRoom, oldState.channel);
        }
    }
});

// Function to create or fetch a chat room for a given VC
async function getOrCreateChatRoomForVC(voiceChannel) {
    // Find an existing chat room or create a new one
    let chatRoom = voiceChannel.guild.channels.cache.find(c => c.name === voiceChannel.name + "-chat" && c.type === 'text');
    if (!chatRoom) {
        // Create the chat room
        chatRoom = await voiceChannel.guild.channels.create(voiceChannel.name + "-chat", {
            type: 'text',
            permissionOverwrites: [
                {
                    id: voiceChannel.guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                ...voiceChannel.members.map(member => ({
                    id: member.id,
                    allow: ['VIEW_CHANNEL'],
                })),
            ],
        });
    }
    return chatRoom;
}

// Function to update chat room permissions based on VC membership
async function updateChatRoomPermissions(chatRoom, voiceChannel) {
    // Reset permissions to VC members only
    const permissions = [
        {
            id: chatRoom.guild.id,
            deny: ['VIEW_CHANNEL'],
        },
        ...voiceChannel.members.map(member => ({
            id: member.id,
            allow: ['VIEW_CHANNEL'],
        })),
    ];

    await chatRoom.overwritePermissions(permissions);
}

// Obtain the chat room associated with a VC, if it exists
async function getChatRoomForVC(voiceChannel) {
    return voiceChannel.guild.channels.cache.find(c => c.name === voiceChannel.name + "-chat" && c.type === 'text');
}

//BOTログイン
client.login(process.env.TOKEN);


