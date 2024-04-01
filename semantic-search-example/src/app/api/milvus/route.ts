// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import { milvus } from "../../utils/milvus";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // init milvus when page ready
    const result = await milvus.init();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}
