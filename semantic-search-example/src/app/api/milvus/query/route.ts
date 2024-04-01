import { NextResponse, NextRequest } from "next/server";
import { milvus, COLLECTION_NAME } from "../../../utils/milvus";

// we can query data from milvus, but we are not use it in this example
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const expr = searchParams.get("expr") || "";
  const result = await milvus.query({ expr, collection_name: COLLECTION_NAME });

  return NextResponse.json(result);
}
