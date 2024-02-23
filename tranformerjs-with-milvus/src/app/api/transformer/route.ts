// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import { embedder } from "./embedder";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json(
      {
        error: "Missing text parameter",
      },
      { status: 400 }
    );
  }

  const result = await embedder.embed(text);

  return NextResponse.json(result);
}
