const express = require("express");
const app = express();
const Discord = require("discord.js");
const fs = require("fs");
const schedule = require("node-schedule");
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
  let minutes = date.getUTCMinutes();
  const direct = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  if (minutes <= 9) {
    minutes = "0" + minutes;
  }
  return `${hours}:${minutes} on ${direct}/${month + 1}/${year}`;
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", (message) => {
  try {
    let oldData = fs.readFileSync("./log.json", "utf-8");
    oldData = JSON.parse(oldData);

    const payload = {
      senderID: message.author.id,
      senderName: message.author.tag,
      content: message.content,
      channel: message.channel.name,
      sentAt: getBDTimeAndDate(),
    };

    const newData = [...oldData, payload];

    fs.writeFileSync("./log.json", JSON.stringify(newData, null, 2), "utf-8");
  } catch (err) {
    console.error(err);
    return;
  }
});

schedule.scheduleJob("0 0 * * *", async () => {
  const embed = new Discord.MessageEmbed()
    .setColor("GREEN")
    .setTitle("✅ Todays Data ✅")
    .setDescription(
      "This is a log of all the messages sent in the last 24 hours."
    )
    .setFooter(getBDTimeAndDate());
  await client.channels.cache.get(process.env.CHANNEL_ID).send(embed);
  await client.channels.cache.get(process.env.CHANNEL_ID).send("", {
    files: ["./log.json"],
  });

  fs.writeFileSync("./log.json", "[]", "utf-8");
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  if (oldMessage.content.includes("open.spotify.com")) return; // Hatred For Spotify
  try {
    const embed = new Discord.MessageEmbed()
      .setColor("YELLOW")
      .setTitle("⚠ Message Edit Detected ⚠")
      .addFields([
        { name: "Message Sender:", value: `<@${oldMessage.author.id}>` },
        { name: "Edited At:", value: `\`${getBDTimeAndDate()}\`` },
        { name: "Channel Name:", value: `\`${oldMessage.channel.name}\`` },
        { name: "Old Message:", value: oldMessage.content },
        { name: "New Message:", value: newMessage.content },
      ]);
    client.channels.cache.get(process.env.CHANNEL_ID).send(embed);
  } catch (err) {
    console.error(err);
    return;
  }
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

    const prettyPrint = JSON.stringify(data.reverse(), null, 2); // make it pretty

    fs.writeFile("./temp/dump.json", prettyPrint, async () => {
      const embed = new Discord.MessageEmbed()
        .setColor("RED")
        .setTitle("⛔ Bulk Delete Detected ⛔")
        .setDescription(
          "Someone has just deleted messages in bulk. I will try to generate a dump file from those messages. (PS: Empty `content` field in an object means that the message was an image or an attachment."
        )
        .addFields([
          {
            name: "Messages Deleted:",
            value: `\`${data.length}\``,
            inline: true,
          },
          {
            name: "Channel Name:",
            value: `\`${data[0].channel}\``,
            inline: true,
          },
        ])
        .setFooter(`${getBDTimeAndDate()}`);

      await client.channels.cache.get(process.env.CHANNEL_ID).send(embed); // Cant send embeds with files for some reason -,-
      await client.channels.cache.get(process.env.CHANNEL_ID).send("", {
        files: ["./temp/dump.json"],
      });

      fs.writeFile("./temp/dump.json", "[]", () =>
        console.log("Dump Resetted")
      );
    });
  } catch (err) {
    console.error(err);
    return;
  }
});

client.login(process.env.token);
