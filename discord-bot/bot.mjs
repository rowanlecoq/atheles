import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

// ── Config ────────────────────────────────────────────────────────────────────

const BOT_TOKEN   = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID   = process.env.DISCORD_CLIENT_ID;
const GUILD_ID    = process.env.DISCORD_GUILD_ID;
const WEBSITE_URL = process.env.WEBSITE_URL || "https://atheles.com";
const SYNC_SECRET = process.env.DISCORD_SYNC_SECRET;

// Role IDs — create these in your Discord server, then paste the IDs here (or in .env)
const ROLE_IDS = {
  bronze:   process.env.DISCORD_ROLE_BRONZE,
  silver:   process.env.DISCORD_ROLE_SILVER,
  gold:     process.env.DISCORD_ROLE_GOLD,
  platinum: process.env.DISCORD_ROLE_PLATINUM,
  champion: process.env.DISCORD_ROLE_CHAMPION,
  athlete:  process.env.DISCORD_ROLE_ATHLETE,
  admin:    process.env.DISCORD_ROLE_ADMIN,
};

const TIER_META = {
  bronze:   { label: "Bronze",   color: 0xa09378, emoji: "🥉" }, // warm tan — base member color
  silver:   { label: "Silver",   color: 0x9ba5ad, emoji: "🥈" }, // cool blue-grey
  gold:     { label: "Gold",     color: 0xc9a96e, emoji: "🥇" }, // muted warm gold
  platinum: { label: "Platinum", color: 0x8ba8b5, emoji: "💎" }, // dusty steel blue
  champion: { label: "Champion", color: 0x9b85b5, emoji: "👑" }, // muted lavender
  athlete:  { label: "Athlete",  color: 0x7aacbe, emoji: "⚡" }, // soft teal
  admin:    { label: "Admin",    color: 0xb07070, emoji: "🛡️" }, // muted rose-red
};

// ── Slash commands ────────────────────────────────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to your Atheles website account")
    .addStringOption((opt) =>
      opt
        .setName("token")
        .setDescription("The link token from your Atheles profile page")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your current Atheles loyalty rank"),

  new SlashCommandBuilder()
    .setName("sync")
    .setDescription("(Admin) Re-sync all Discord roles to current website ranks")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
].map((c) => c.toJSON());

// ── Register commands ─────────────────────────────────────────────────────────

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

async function registerCommands() {
  console.log("Registering slash commands…");
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Slash commands registered.");
}

// ── Discord client ────────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(`${WEBSITE_URL}${path}`, {
    headers: { "x-discord-sync-secret": SYNC_SECRET },
  });
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${WEBSITE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-discord-sync-secret": SYNC_SECRET,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Removes all tier roles from a member, then assigns the correct one.
async function applyTierRole(member, tier) {
  const allRoleIds = Object.values(ROLE_IDS).filter(Boolean);
  const toRemove = member.roles.cache.filter((r) => allRoleIds.includes(r.id));
  if (toRemove.size > 0) await member.roles.remove(toRemove);

  const roleId = ROLE_IDS[tier];
  if (roleId) await member.roles.add(roleId);
}

// ── Interaction handler ───────────────────────────────────────────────────────

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;

  // ── /link ──────────────────────────────────────────────────────────────────
  if (interaction.commandName === "link") {
    const token = interaction.options.getString("token", true).trim();

    const result = await apiPost("/api/discord/link", {
      token,
      discordId: interaction.user.id,
      discordUsername: interaction.user.username,
    });

    if (!result.success) {
      return interaction.editReply(
        `❌ Could not link your account: **${result.error || "invalid token"}**\n\nGet a fresh token from your profile page: ${WEBSITE_URL}/profile`,
      );
    }

    const meta = TIER_META[result.tier] || TIER_META.bronze;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} Account Linked!`)
      .setDescription(`You are now linked to your Atheles account.`)
      .addFields({ name: "Current Rank", value: `${meta.emoji} **${meta.label}**` });

    // Apply role in the guild
    if (guild) {
      try {
        const member = await guild.members.fetch(interaction.user.id);
        await applyTierRole(member, result.tier);
        embed.setFooter({ text: "Your rank role has been applied." });
      } catch (err) {
        console.error("Role assignment error:", err);
        embed.setFooter({ text: "Linked! (Could not assign role — check bot permissions)" });
      }
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // ── /rank ──────────────────────────────────────────────────────────────────
  if (interaction.commandName === "rank") {
    const result = await apiGet(
      `/api/discord/rank?discordId=${interaction.user.id}`,
    );

    if (!result.tier) {
      return interaction.editReply(
        `❌ Your Discord is not linked to an Atheles account yet.\n\nRun \`/link <token>\` — get your token at ${WEBSITE_URL}/profile`,
      );
    }

    const meta = TIER_META[result.tier] || TIER_META.bronze;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${meta.label}`)
      .addFields(
        { name: "Points", value: result.points?.toLocaleString() ?? "—", inline: true },
        { name: "Next Tier", value: result.nextTier ? `${TIER_META[result.nextTier]?.label ?? result.nextTier}` : "Max rank!", inline: true },
      );

    return interaction.editReply({ embeds: [embed] });
  }

  // ── /sync ──────────────────────────────────────────────────────────────────
  if (interaction.commandName === "sync") {
    if (!guild) return interaction.editReply("❌ Must be used in the server.");

    await interaction.editReply("⏳ Syncing roles… this may take a moment.");

    const result = await apiGet("/api/discord/sync");

    if (!result.users) {
      return interaction.editReply(`❌ Sync failed: ${result.error || "unknown error"}`);
    }

    let synced = 0;
    let failed = 0;

    for (const u of result.users) {
      try {
        const member = await guild.members.fetch(u.discordId).catch(() => null);
        if (!member) continue;
        await applyTierRole(member, u.tier);
        synced++;
      } catch {
        failed++;
      }
    }

    return interaction.editReply(
      `✅ Sync complete — **${synced}** updated, **${failed}** failed.`,
    );
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────

await registerCommands();
client.login(BOT_TOKEN);
