import {
  AutoProcessor,
  RawImage,
  CLIPVisionModelWithProjection,
} from "@xenova/transformers";
import Papaparse from "papaparse";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import path from "path";
import fs from "fs/promises";
import dotEnv from "dotenv";
dotEnv.config({ path: "./.env.local" });

if (!process.env.URI) {
  throw new Error("Milvus URI is required");
}

const DIM = 512; // model Xenova/all-MiniLM-L6-v2 embedding dimension
export const COLLECTION_NAME = "semantic_image_search"; // example collection name
export const VECTOR_FIELD_NAME = "vector"; // verctor field name
export const METRIC_TYPE = "COSINE";
export const INDEX_TYPE = "AUTOINDEX";

const milvusClient = new MilvusClient({
  address: process.env.URI || "",
  token: process.env.TOKEN,
  channelOptions: {
    // starter cluster will throw rejected by server because of excess ping, so we need to adjust the ping interval
    "grpc.keepalive_time_ms": 40000, // Adjust the time interval between pings
    "grpc.keepalive_timeout_ms": 5000, // Adjust the time to wait for a response to a ping
  },
});

await milvusClient.createCollection({
  collection_name: COLLECTION_NAME,
  dimension: DIM,
  metric_type: METRIC_TYPE,
  auto_id: true,
});
console.log("---- Connect to Milvus and collection success ----");
const csvAbsolutePath = await path.resolve(".", "photos.tsv");
const csvData = await fs.readFile(csvAbsolutePath, "utf8");

const parsedData = await Papaparse.parse(csvData, {
  delimiter: "\t",
  dynamicTyping: true,
  header: true,
  skipEmptyLines: true,
});

const data = parsedData.data.map((v) => ({
  imageId: v.photo_id,
  url: v.photo_image_url,
  aiDescription: v.ai_description,
  photoDescription: v.photo_description,
  photoAspectRatio: v.photo_aspect_ratio,
  blurHash: v.blur_hash,
}));
console.log("--- data ---", data.length);
const model_id = "Xenova/clip-vit-base-patch16";
const processor = await AutoProcessor.from_pretrained(model_id);
const vision_model = await CLIPVisionModelWithProjection.from_pretrained(
  model_id,
  {
    quantized: false,
  }
);

// Load processor and vision model
for (const [index, imageData] of data.entries()) {
  let image;
  try {
    image = await RawImage.read(imageData.url);
  } catch (e) {
    // Unable to load image, so we ignore it
    console.warn("Ignoring image due to error", e);
    continue;
  }
  console.log(`----- Read image ${index} success -----`);
  // Read image and run processor
  let image_inputs = await processor(image);

  // Compute embeddings
  const { image_embeds } = await vision_model(image_inputs);
  const imageVector = image_embeds.tolist()[0];
  console.log(`----- Embedding image ${index} success -----`);

  // await milvusClient.insert({
  //   collection_name: COLLECTION_NAME,
  //   fields_data: [
  //     {
  //       vector: imageVector,
  //       imageId: imageData.imageId,
  //       url: imageData.url,
  //       ratio: imageData.photoAspectRatio,
  //       aiDescription: imageData.aiDescription,
  //       photoDescription: imageData.photoDescription,
  //       blurHash: imageData.blurHash,
  //     },
  //   ],
  // });
  console.log(`----- Insert image ${index} insert success -----`);
}

console.log(`----- Done insert ${data.length} images -----`);
