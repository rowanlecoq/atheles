import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (token !== process.env.DISCORD_BOT_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  };

  // Clear guild-specific commands
  const guildRes = await fetch(
    `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/guilds/${process.env.DISCORD_GUILD_ID}/commands`,
    { method: "PUT", headers, body: JSON.stringify([]) },
  );

  // Clear global commands
  const globalRes = await fetch(
    `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/commands`,
    { method: "PUT", headers, body: JSON.stringify([]) },
  );

  if (!guildRes.ok || !globalRes.ok) {
    const guildText = await guildRes.text();
    const globalText = await globalRes.text();
    return NextResponse.json({ error: { guild: guildText, global: globalText } }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "All guild and global slash commands cleared." });
}
