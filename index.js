const Discord = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Discord.Client();

const getBDTimeAndDate = () => {
  const date = new Date();
  const hours = date.getUTCHours() + 6;
  const minutes = date.getUTCMinutes();
  const direct = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return `${hours}:${minutes} on ${direct}/${month + 1}/${year}`;
};

getBDTimeAndDate();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageDelete", (message) => {
  try {
    const embed = new Discord.MessageEmbed()
      .setColor("RED")
      .setTitle(`⛔ Delete Detected ⛔`)
      .addFields([
        { name: "Message Sender:", value: `<@${message.author.id}>` },
        { name: "Content:", value: `${message.content}` },
        { name: "Deleted At:", value: `${getBDTimeAndDate()}` },
      ]);

    client.channels.cache.get(process.env.CHANNEL_ID).send(embed);
  } catch (err) {
    console.error(err);
  }
});

client.on("messageDeleteBulk", (messages) => {
  try {
    // code beyond this point is highly experimental
    const list = messages.map((item) => {
      return {
        id: item.author.id,
        content: item.content,
        username: item.author.tag,
      };
    });

    const create = new Promise((resolve, reject) => {
      fs.writeFileSync(`./temp/temp.json`, JSON.stringify(list));
      resolve("file created");
    });
    create.then(() => {
      const embed = new Discord.MessageEmbed()
        .setTitle("Bulk Delete Detected")
        .setColor("YELLOW")
        .setFooter(`Time: ${getBDTimeAndDate()}`);
      client.channels.cache
        .get(process.env.CHANNEL_ID)
        .send(embed, { files: [`./temp/temp.json`] });
    });
  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.token);
