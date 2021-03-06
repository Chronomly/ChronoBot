//eslint-disable-next-line
console.log('Starting...');
const config = require('./config.json');
const commando = require('discord.js-commando');
const client = new commando.Client({
  owner: [config.owner],
  selfbot: true,
  commandPrefix: config.prefix,
  unknownCommandResponse: false
});
const path = require('path');
const sqlite = require('sqlite');
const oneLine = require('common-tags').oneLine;
const { RichEmbed } = require('discord.js');
console.log('Packages initialized.');

client.registry
  .registerGroups([
    ['general', 'general'],
    ['misc', 'Miscellaneous'],
    ['fun', 'Fun'],
    ['control', 'Control']
  ])
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerDefaultCommands({
    help: false,
    prefix: true,
    eval_: true,
    ping: true,
    commandState: false
  })
  .registerCommandsIn(path.join(__dirname, 'commands'));

client.setProvider(sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new commando.SQLiteProvider(db))).catch(console.error);
console.log('Command framework set up.');
console.log('Awaiting log in.');

client
  .on('error', console.error)
  .on('warn', console.warn)
  .on('debug', console.log)
  .on('ready', () => {
    console.log(`Client ready; logged in as ${client.user.tag} (${client.user.id}) with prefix "${config.prefix}"`)
    console.log('Awaiting actions.')
  })
  .on('disconnect', () => console.warn('Disconnected!'))
  .on('reconnecting', () => console.warn('Reconnecting...'))
  .on('commandError', (cmd, err) => {
    if (err instanceof commando.FriendlyError) return;
    console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
  })
  .on('commandBlocked', (msg, reason) => {
    console.log(oneLine `
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
  })
  .on('commandPrefixChange', (guild, prefix) => {
    console.log(oneLine `
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
  })
  .on('commandStatusChange', (guild, command, enabled) => {
    console.log(oneLine `
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
  })
  .on('groupStatusChange', (guild, group, enabled) => {
    console.log(oneLine `
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
  })
  .on('commandRun', (command, promise, msg) => {
    if (msg.guild) {
      console.log(`Command ran
        Guild: ${msg.guild.name} (${msg.guild.id})
        Channel: ${msg.channel.name} (${msg.channel.id})
        User: ${msg.author.tag} (${msg.author.id})
        Command: ${command.groupID}:${command.memberName}
        Message: "${msg.content}"`)
    } else {
      console.log(`Command ran:
        Guild: DM
        Channel: N/A
        User: ${msg.author.tag} (${msg.author.id})
        Command: ${command.groupID}:${command.memberName}
        Message: "${msg.content}"`)
    }
  })
  .on('message', (message) => {
    if (message.author !== client.user) return
    if (message.content.startsWith('>>')) {
      if (message.guild.member(client.user).hasPermission('EMBED_LINKS')) {
        let text = message.content.split('').slice(2).join('')
        const embed = new RichEmbed()
          .setAuthor('', `${client.user.avatarURL}`)
          .setDescription(`${text}`)
          .setColor(3447003)
        message.edit({ embed })
        //eslint-disable-next-line no-negated-condition
      } else if (!message.guild.member(client.user).hasPermission('EMBED_LINKS')) {
        message.edit('Missing permissions to send embeds.')
          .then((msg) => {
            msg.delete(5000)
          })
      } else {
        message.edit('Unknown permissions error.')
          .then((msg) => {
            msg.delete(5000)
          })
      }
    }
  })


client.login(config.token).catch(console.error);

process.on('unhandledRejection', err => {
  console.error('Something went wrong! \nPlease show the message below to a developer. \nYou can contact the developers here: https://discord.gg/fu4zS9')
  console.error(`Uncaught Promise Error: \n${err.stack}`);
});
