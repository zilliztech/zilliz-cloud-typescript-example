// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import Papaparse from "papaparse";
import { embedder } from "../../../utils/embedder";
import { COLLECTION_NAME, CSV_KEYS, milvus } from "../../../utils/milvus";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const onlyCsv = searchParams.get("onlyCsv") || false;
  try {
    const csvAbsolutePath = await path.resolve("test.csv");
    const data = await fs.readFile(csvAbsolutePath, "utf8");

    const parsedData = await Papaparse.parse(data, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });
    if (onlyCsv) {
      return NextResponse.json(parsedData.data);
    }
    const total = parsedData.data.length;
    const insertDatas = [];
    for (let i = 0; i < total; i++) {
      const row = parsedData.data[i] as any;
      const data = await embedder.embed(row[CSV_KEYS.QUESTION]);

      insertDatas.push({
        id: row[CSV_KEYS.ID],
        vector: data.values,
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
