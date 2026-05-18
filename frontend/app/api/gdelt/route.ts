import { NextResponse } from "next/server";

const GDELT_URL =
  "https://api.gdeltproject.org/api/v2/doc/doc" +
  "?query=conflict%20OR%20military%20OR%20attack%20OR%20sanctions" +
  "&mode=artlist&maxrecords=50&format=json&timespan=24h";

export async function GET() {
  try {
    const res = await fetch(GDELT_URL, { next: { revalidate: 900 } }); // 15-min cache
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ articles: [] }, { status: 200 });
  }
}
