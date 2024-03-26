// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import { milvus, COLLECTION_NAME, CSV_KEYS } from "../../../utils/milvus";
import { embedder } from "../../../utils/embedder";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const data = await embedder.embed(text);
    const result = await milvus.search({
      vector: data.values,
      collection_name: COLLECTION_NAME,
      output_fields: [CSV_KEYS.QUESTION, CSV_KEYS.ANSWER],
      limit: 10,
    });
    console.log("result-----:", result);

    return NextResponse.json(result || {});
  } catch (error) {
    console.log("---error", error);
    return NextResponse.json(error || {});
  }
}
