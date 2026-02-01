import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
export async function GET(
  _: Request,
  { params }: { params: { itemId: string } }
) {
  const dir = path.join(process.cwd(), "public/evidence", params.itemId);
if (!fs.existsSync(dir)) {
    return NextResponse.json([]);
  }
const files = fs.readdirSync(dir);
  return NextResponse.json(files);
}
