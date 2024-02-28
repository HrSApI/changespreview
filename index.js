require("dotenv/config");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
} = require("discord.js");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const client = new Client({
  intents: [Object.keys(GatewayIntentBits)],
  partials: [Object.keys(Partials)],
});

client.on(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

const PORT = process.env.PORT || 3000;
const CHANNEL_ID = "1110946409647190146";

app.use(bodyParser.json());

app.post("/github-webhook", (req, res) => {
  const { ref, commits } = req.body;

  if (ref && ref === "refs/heads/master") {
    const changes = commits
      .map((commit) => `${commit.author.name}: ${commit.message}`)
      .join("\n");
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("New Commits Pushed to Master")
      .setDescription(changes);

    const channel = client.channels.cache.get(CHANNEL_ID);
    channel.send({
      embeds: [embed],
    });
  }
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

client.login(process.env.TOKEN);
