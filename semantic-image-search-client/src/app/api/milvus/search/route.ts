import { COLLECTION_NAME, milvus } from "@/app/utils/milvus";
import { NextResponse, NextRequest } from "next/server";
export const dynamic = "force-dynamic";

/**
 * Handles the POST request for searching in Milvus.
 * @param req - The NextRequest object containing the request data.
 * @returns A NextResponse object with the search result in JSON format.
 */
export async function POST(req: NextRequest) {
  try {
    const { vectors } = await req.json();

    const result = await milvus.search({
      vector: vectors as number[],
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
        memory: process.memoryUsage(),
        storage: process.cpuUsage(),
      } || {}
    );
  }
}
