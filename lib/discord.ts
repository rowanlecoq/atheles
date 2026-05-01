const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const GUILD_ID = process.env.DISCORD_GUILD_ID || "";

const ROLE_IDS: Record<string, string | undefined> = {
  bronze:   process.env.DISCORD_ROLE_BRONZE,
  silver:   process.env.DISCORD_ROLE_SILVER,
  gold:     process.env.DISCORD_ROLE_GOLD,
  platinum: process.env.DISCORD_ROLE_PLATINUM,
  champion: process.env.DISCORD_ROLE_CHAMPION,
  athlete:  process.env.DISCORD_ROLE_ATHLETE,
  admin:    process.env.DISCORD_ROLE_ADMIN,
};

const ALL_ROLE_IDS = Object.values(ROLE_IDS).filter(Boolean) as string[];

async function discordFetch(path: string, method = "PUT") {
  if (!BOT_TOKEN || !GUILD_ID) return;
  return fetch(`https://discord.com/api/v10${path}`, {
    method,
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Length": "0" },
  });
}

export async function assignDiscordRole(discordId: string, tier: string) {
  if (!BOT_TOKEN || !GUILD_ID) return;

  // Strip all tier roles, then apply the correct one
  await Promise.allSettled(
    ALL_ROLE_IDS.map((id) =>
      discordFetch(`/guilds/${GUILD_ID}/members/${discordId}/roles/${id}`, "DELETE"),
    ),
  );

  const roleId = ROLE_IDS[tier];
  if (roleId) {
    await discordFetch(`/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`);
  }
}
