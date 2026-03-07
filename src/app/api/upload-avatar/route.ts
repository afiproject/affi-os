import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_NAMES = [
  "avatar-haruka.png",
  "avatar-takuya.png",
  "avatar-misaki.png",
  "avatar-kotone.png",
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;

  if (!file || !name || !ALLOWED_NAMES.includes(name)) {
    return NextResponse.json({ error: "Invalid file or name" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "avatars");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);

  return NextResponse.json({ ok: true, name });
}
