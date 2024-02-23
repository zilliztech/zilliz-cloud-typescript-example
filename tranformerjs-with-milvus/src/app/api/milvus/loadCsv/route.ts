// Create a custom request handler for the /classify route.
// For more information, see https://nextjs.org/docs/app/building-your-application/routing/router-handlers

import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import Papaparse from "papaparse";
import { loadStatus } from "./status";
import { embedder } from "../../transformer/embedder";
import { COLLECTION_NAME, milvus } from "../milvus";

export async function GET(req: NextRequest) {
  try {
    if (loadStatus.currentData) {
      return NextResponse.json({ data: "Csv data is loading ... " });
    }
    const csvAbsolutePath = await path.resolve("test.csv");
    const data = await fs.readFile(csvAbsolutePath, "utf8");

    const parsedData = await Papaparse.parse(data, {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
    });
    const total = parsedData.data.length;
    parsedData.data.forEach(async (row: any, index: number) => {
      const data = await embedder.embed(row.question1);
      const res = await milvus.insert({
        fields_data: [
          {
            id: row.test_id,
            vector: data.values,
            question1: row.question1,
            question2: row.question2,
          },
        ],
        collection_name: COLLECTION_NAME,
      });
      console.log("---insert data", res, index, total);
      loadStatus.percent = Math.round(((index + 1) / total) * 100);
      loadStatus.currentData = total === index + 1 ? undefined : data;
      console.log("---loadStatus", loadStatus);
    });
    return NextResponse.json(parsedData);
  } catch (err) {
    console.error(err);
    return NextResponse.json(err);
  }
}
