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
const githubToken = process.env.GITHUB_TOKEN;
const repoOwner = "HrSApI";
const repoName = "changespreview";
const CHANNEL_ID = "1110946409647190146";

app.use(bodyParser.json());

client.on(Events.MessageCreate, async (message) => {
  if (message.content === "!commitupdates") {
    try {
      const commits = await fetchCommits();
      const embed = createEmbed(commits);
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching commits:", error);
      message.channel.send("Error fetching commits.");
    }
  }
});

async function fetchCommits() {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/commits`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${githubToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch commits");
  }
  const data = await response.json();
  return data.slice(0, 5); // Limiting to the latest 5 commits
}

function createEmbed(commits) {
  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("Latest Commit Updates")
    .setDescription("Here are the latest commits in the repository:");

  commits.forEach((commit) => {
    embed.setDescription(
      `${commit.commit.author.name} - ${commit.commit.message}`
    );
  });

  return embed;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

client.login(process.env.TOKEN);
