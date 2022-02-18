const express = require("express");
const app = express();
const Discord = require("discord.js");
const fs = require("fs/promises");
require("dotenv").config();

const port = 3000;

app.get("/", (_, res) => res.send("Hello World!"));

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);

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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageDelete", (message) => {
  if (message.author.bot) return;
  if (message.content.split(" ")[0] === "!clear") return; // mee6 specific shit

  try {
    const embed = new Discord.MessageEmbed()
      .setColor("RED")
      .setTitle(`⛔ Delete Detected ⛔`)
      .addFields([
        { name: "Message Sender:", value: `<@${message.author.id}>` },
        { name: "Deleted At:", value: `\`${getBDTimeAndDate()}\`` },
        { name: "Channel Name:", value: `\`${message.channel.name}\`` },
        { name: "Message:", value: `${message.content}` },
      ]);

    client.channels.cache.get(process.env.CHANNEL_ID).send(embed);
  } catch (err) {
    console.error(err);
    return;
  }
});

client.on("messageDeleteBulk", async (messages) => {
  try {
    const data = messages.map((message) => {
      return {
        senderID: message.author.id,
        senderName: message.author.tag,
        content: message.content,
        channel: message.channel.name,
        deletedAt: getBDTimeAndDate(),
      };
    });

    const prettyPrint = JSON.stringify(data, null, 2); // make it pretty

    await fs.writeFile("./temp/dump.json", prettyPrint, "utf-8");

    const embed = new Discord.MessageEmbed()
      .setColor("YELLOW")
      .setTitle("⛔ Bulk Delete Detected ⛔")
      .setDescription(
        "Someone has just deleted messages in bulk. I will try to generate a dump file from those messages. (PS: Empty `content` field in an object means that the message was an image or an attachment."
      )
      .setFooter(`${getBDTimeAndDate()}`);

    await client.channels.cache.get(process.env.CHANNEL_ID).send(embed); // Cant send embeds with files for some reason -,-

    client.channels.cache.get(process.env.CHANNEL_ID).send("", {
      files: ["./temp/dump.json"],
    });

  } catch (err) {
    console.error(err);
    return;
  }
});

client.login(process.env.token);
