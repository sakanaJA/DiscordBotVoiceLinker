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
client.on('messageCreate', async message => {
    if (message.content === '!clear' && message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        try {
            let fetched = await message.channel.messages.fetch({ limit: 100 });
            await message.channel.bulkDelete(fetched);
            console.log('Messages deleted');
message.channel.send('All messages have been deleted.\nメッセージがすべて削除されました。');
        } catch (error) {
            console.error('Error in message deletion: ', error);
            message.channel.send('メッセージの削除中にエラーが発生しました。');
        }
    }
});

// ボットのログイン
client.login(process.env.TOKEN);
