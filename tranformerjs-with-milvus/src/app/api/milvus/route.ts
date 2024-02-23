// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import { milvus } from "./milvus";

export async function GET(req: NextRequest) {
  const result = await milvus.listCollections();

  return NextResponse.json(result);
}
