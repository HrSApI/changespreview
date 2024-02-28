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
  return data;
}

async function fetchCommitFiles(commitSha) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${commitSha}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${githubToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch commit details");
  }
  const data = await response.json();
  return data.files;
}

client.on(Events.MessageCreate, async (message) => {
  if (message.content === "!commitupdates") {
    try {
      const commits = await fetchCommits();
      const latestCommit = commits[0];
      const filesChanged = await fetchCommitFiles(latestCommit.sha);
      const embeds = createEmbed(latestCommit, filesChanged);
      message.channel.send({ embeds: embeds });
    } catch (error) {
      console.error("Error fetching commits:", error);
      message.channel.send("Error fetching commits.");
    }
  }
});

function createEmbed(commit, filesChanged) {
  const commitEmbed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("Latest Commit Updates")
    .setDescription(
      `**Here are the latest commits in the repository:\n\n Commit Message:** **${
        commit.commit.message
      }** \n\n SHA: **[${commit.sha}](${commit.html_url})** \n\n By: **${
        commit.commit.author.name
      }** committed on **${new Date(
        commit.commit.author.date
      ).toDateString()}**`
    );

  const fileEmbeds = filesChanged.map((file) => {
    return new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`Changes in ${file.filename}`)
      .setDescription("```diff\n" + file.patch + "\n```");
  });

  return [commitEmbed, ...fileEmbeds];
}

app.post("/github-webhook", async (req, res) => {
  const event = req.headers["x-github-event"];

  if (event === "check_run") {
    try {
      const commits = await fetchCommits();
      const latestCommit = commits[0];
      const filesChanged = await fetchCommitFiles(latestCommit.sha);
      const embeds = createEmbed(latestCommit, filesChanged);
      client.channels.cache.get(CHANNEL_ID).send({ embeds: embeds });
    } catch (error) {
      console.error("Error fetching commits:", error);
      client.channels.cache
        .get(CHANNEL_ID)
        .send({ content: "Error fetching commits." });
    }
  }

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

client.login(process.env.TOKEN);
