import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "docs");
const ALLOWED = new Set([
  "GETTING_STARTED", "ARCHITECTURE", "AI_PROVIDERS", "DEPLOYMENT",
  "TROUBLESHOOTING", "CUSTOMIZATION", "LICENSING", "SECURITY", "THIRD_PARTY_LICENSES",
]);

export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const base = file.replace(/\.md$/i, "");
  if (!ALLOWED.has(base)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const fp = path.join(DOCS_DIR, `${base}.md`);
  try {
    const md = await readFile(fp, "utf-8");
    return new NextResponse(md, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Document not available" }, { status: 404 });
  }
}
