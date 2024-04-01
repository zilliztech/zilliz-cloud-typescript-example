import { milvus } from "@/app/utils/milvus";
import { NextResponse, NextRequest } from "next/server";

/**
 * Retrieves the progress, insertion status, and error message of the Milvus CSV loading process.
 * @param req The NextRequest object.
 * @returns A NextResponse object containing the progress, insertion status, and error message.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    progress: milvus.insertProgress,
    isInserting: milvus.isInserting,
    errorMsg: milvus.errorMsg,
  });
}
