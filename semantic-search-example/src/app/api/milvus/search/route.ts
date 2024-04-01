import { NextResponse, NextRequest } from "next/server";
import { milvus, COLLECTION_NAME, CSV_KEYS } from "../../../utils/milvus";
import { embedder } from "../../../utils/embedder";
export const dynamic = "force-dynamic";

/**
 * Handles the POST request for searching in Milvus.
 * @param req - The NextRequest object containing the request data.
 * @returns A NextResponse object with the search result in JSON format.
 */
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    // embed
    const data = await embedder.embed(text);
    const result = await milvus.search({
      vector: data.values as number[],
      collection_name: COLLECTION_NAME,
      output_fields: [CSV_KEYS.QUESTION, CSV_KEYS.ANSWER, CSV_KEYS.CSV_ID],
      limit: 10,
    });
    console.log("result-----:", result);

    return NextResponse.json(result || {});
  } catch (error) {
    console.log("---error", error);
    return NextResponse.json(error || {});
  }
}
