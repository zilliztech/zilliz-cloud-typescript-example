import {
  InsertReq,
  MilvusClient,
  MutationResult,
  QueryReq,
  SearchSimpleReq,
} from "@zilliz/milvus2-sdk-node";
import { embedder } from "./embedder";

// Define constants for the Milvus client
const DIM = 384; // model Xenova/all-MiniLM-L6-v2 embedding dimension
export const COLLECTION_NAME = "semantic_search_example"; // example collection name
export const VECTOR_FIELD_NAME = "vector"; // verctor field name
export const METRIC_TYPE = "COSINE";
export const INDEX_TYPE = "AUTOINDEX";

export enum CSV_KEYS {
  QUESTION = "question",
  ANSWER = "answer",
  CSV_ID = "csvId",
}

// Define the Milvus class
class Milvus {
  private _client: MilvusClient | undefined;
  private _MAX_INSERT_COUNT = 100;
  private _insert_progress = 0;
  private _is_inserting = false;
  private _error_msg = "";

  constructor() {
    if (!this._client) {
      this.init(); // Initialize the Milvus client
    }
  }

  // Get the Milvus client
  public getClient() {
    return this._client;
  }

  // Check if a collection exists
  public async hasCollection() {
    return await this._client?.hasCollection({
      collection_name: COLLECTION_NAME,
    });
  }

  // Initialize the Milvus client
  public async init() {
    if (!process.env.URI) {
      throw new Error("URI is required, please check your .env file.");
    }

    try {
      this._client = new MilvusClient({
        address: process.env.URI || "",
        token: process.env.TOKEN,
        channelOptions: {
          // starter cluster will throw rejected by server because of excess ping, so we need to adjust the ping interval
          "grpc.keepalive_time_ms": 40000, // Adjust the time interval between pings
          "grpc.keepalive_timeout_ms": 5000, // Adjust the time to wait for a response to a ping
        },
      });
      return await this.createCollection(); // Create a new collection
    } catch (error) {
      throw error;
    }
  }

  // Create a new collection
  public async createCollection() {
    try {
      const res = await this.hasCollection(); // Check if the collection exists
      if (res?.value) {
        return res;
      }
      const collectionRes = await this._client?.createCollection({
        collection_name: COLLECTION_NAME,
        dimension: DIM,
        metric_type: METRIC_TYPE,
        auto_id: true,
      });

      return collectionRes;
    } catch (error) {
      throw error;
    }
  }

  // List all collections
  public async listCollections() {
    const res = await this._client?.listCollections();
    return res;
  }

  // Query data from a collection
  public async query(data: QueryReq) {
    return await this._client?.query(data);
  }

  // Search for data in a collection
  public async search(data: SearchSimpleReq) {
    return await this._client?.search({
      ...data,
    });
  }

  // Insert data into a collection
  public async insert(data: InsertReq) {
    try {
      const res = await this._client?.insert(data);
      return res;
    } catch (error) {
      throw error;
    }
  }

  public async batchInsert(
    texts: { [key in CSV_KEYS]: string }[],
    startIndex: number
  ): Promise<MutationResult | undefined> {
    try {
      const total = texts.length;
      const endIndex = startIndex + this._MAX_INSERT_COUNT;
      const insertTexts = texts.slice(startIndex, endIndex);
      this._is_inserting = true;

      if (startIndex === 0) {
        this._insert_progress = 0;
      }
      const insertDatas = [];
      for (let i = 0; i < insertTexts.length; i++) {
        const row = insertTexts[i] as any;
        // embed question to vector by module all-MiniLM-L6-v2
        const data = await embedder.embed(row[CSV_KEYS.QUESTION]);

        insertDatas.push({
          vector: data.values,
          /**
           * The question and answer are stored as dynamic JSON.
           * They won't appear in the schema, but can be retrieved during a similarity search.
           * */
          question: row[CSV_KEYS.QUESTION],
          answer: row[CSV_KEYS.ANSWER],
        });
      }
      console.log(
        `--- ${startIndex} ~ ${endIndex} embedding done, begin to insert into milvus --- `
      );
      const res = await milvus.insert({
        fields_data: insertDatas,
        collection_name: COLLECTION_NAME,
      });
      this._insert_progress = Math.floor((endIndex / total) * 100);
      console.log(
        `--- ${startIndex} ~ ${endIndex} insert done, ${this._insert_progress}% now ---`
      );
      if (endIndex < total) {
        return await this.batchInsert(texts, endIndex + 1);
      }
      this._insert_progress = 100;
      this._is_inserting = false;
      return res;
    } catch (error) {
      this._insert_progress = 0;
      this._is_inserting = false;
      this._error_msg = (error as any).message || "Insert failed";
    }
  }

  get insertProgress() {
    return this._insert_progress;
  }

  get isInserting() {
    return this._is_inserting;
  }

  get errorMsg() {
    return this._error_msg;
  }
}

// Create a singleton instance of the Milvus class
const milvus = new Milvus();

export { milvus };
