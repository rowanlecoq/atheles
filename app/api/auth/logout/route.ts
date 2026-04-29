import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("atheles-auth-token");
  cookieStore.delete("atheles-logged-in");
  return NextResponse.json({ success: true });
}
