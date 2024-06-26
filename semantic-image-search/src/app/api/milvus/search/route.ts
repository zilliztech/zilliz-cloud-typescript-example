import { NextResponse, NextRequest } from "next/server";
import { milvus, COLLECTION_NAME } from "../../../utils/milvus";
import { embedder } from "../../../utils/embedder";
export const dynamic = "force-dynamic";

/**
 * Handles the POST request for searching in Milvus.
 * @param req - The NextRequest object containing the request data.
 * @returns A NextResponse object with the search result in JSON format.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const text = searchParams.get("text") || "";
    // embed
    let data = [];
    if (text.includes("https")) {
      data = await embedder.embedImage(text);
    } else {
      data = await embedder.embed(text);
    }

    const result = await milvus.search({
      vector: data as number[],
      collection_name: COLLECTION_NAME,
      output_fields: [
        "url",
        "id",
        "blurHash",
        "aiDescription",
        "photoDescription",
        "ratio",
      ],
      limit: 60,
    });

    return NextResponse.json(result || {});
  } catch (error) {
    return NextResponse.json(
      {
        error,
      } || {}
    );
  }
}
