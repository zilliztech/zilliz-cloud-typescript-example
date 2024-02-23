// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import { milvus, COLLECTION_NAME, VECTOR_FIELD_NAME } from "../milvus";
import { embedder } from "../../transformer/embedder";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const data = await embedder.embed(text);
  const result = await milvus.search({
    vectors: [data.values],
    collection_name: COLLECTION_NAME,
    output_fields: ["question1", "question2"],
    limit: 30,
  });

  return NextResponse.json(result);
}
