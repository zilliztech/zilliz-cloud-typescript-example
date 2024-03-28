// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import Papaparse from "papaparse";
import { embedder } from "../../../utils/embedder";
import { COLLECTION_NAME, CSV_KEYS, milvus } from "../../../utils/milvus";
export const dynamic = "force-dynamic";

/* 
  Note: API requests may timeout on Vercel's free plan as it has a maximum timeout limit of 10 seconds 
  And 500 question need 3 mins.
*/
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  // Client get only csv data, for random question
  const onlyCsv = searchParams.get("onlyCsv") || false;
  // We insert 500 rows each time
  const startRow = Number(searchParams.get("startRow"));
  const insertIndex = isNaN(startRow) ? 0 : startRow;
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
    const total = parsedData.data.length;
    const max = insertIndex + 500 > total ? total : insertIndex + 500;
    const insertDatas = [];
    for (let i = insertIndex; i < max; i++) {
      const row = parsedData.data[i] as any;
      // embed question to vector by module all-MiniLM-L6-v2
      const data = await embedder.embed(row[CSV_KEYS.QUESTION]);

      insertDatas.push({
        id: row[CSV_KEYS.ID],
        vector: data.values,
        /**
         * The question and answer are stored as dynamic JSON.
         * They won't appear in the schema, but can be retrieved during a similarity search.
         * */
        question: row[CSV_KEYS.QUESTION],
        answer: row[CSV_KEYS.ANSWER],
      });
    }
    console.log("--- insertDatas", insertDatas.length);
    const res = await milvus.insert({
      fields_data: insertDatas,
      collection_name: COLLECTION_NAME,
    });
    console.log("----res", res);
    return NextResponse.json(res || {});
  } catch (err) {
    console.error(err);
    return NextResponse.json(err);
  }
}
