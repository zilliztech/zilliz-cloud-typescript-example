// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import Papaparse from "papaparse";
import { milvus } from "../../../utils/milvus";
export const dynamic = "force-dynamic";

/* 
  Note: API requests may timeout on Vercel's free plan as it has a maximum timeout limit of 10 seconds 
*/
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  // Client get only csv data, for random question
  const onlyCsv = searchParams.get("onlyCsv") || false;
  try {
    const csvAbsolutePath = await path.resolve("./public", "test.csv");
    const data = await fs.readFile(csvAbsolutePath, "utf8");

    // get csv data in json format
    const parsedData = await Papaparse.parse(data, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });
    if (onlyCsv) {
      return NextResponse.json(parsedData.data);
    }
    milvus.batchInsert(parsedData.data as [], 0);
    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(err);
  }
}
