// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { milvus } from "@/app/utils/milvus";
import { NextResponse, NextRequest } from "next/server";

// we can query data from milvus, but we are not use it in this example
export async function GET(req: NextRequest) {
  return NextResponse.json({
    progress: milvus.insertProgress,
    isInserting: milvus.isInserting,
    errorMsg: milvus.errorMsg,
  });
}
