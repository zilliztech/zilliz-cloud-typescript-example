import {
  InsertReq,
  MilvusClient,
  QueryReq,
  SearchSimpleReq,
} from "@zilliz/milvus2-sdk-node";

// Define constants for the Milvus client
const DIM = 384; // model Xenova/all-MiniLM-L6-v2 embedding dimension
export const COLLECTION_NAME = "transformerjs_with_milvus"; // example collection name
export const VECTOR_FIELD_NAME = "vector"; // verctor field name
export const METRIC_TYPE = "COSINE";
export const INDEX_TYPE = "AUTOINDEX";

export enum CSV_KEYS {
  ID = "id",
  QUESTION = "question",
  ANSWER = "answer",
}

// Define the Milvus class
class Milvus {
  private _client: MilvusClient | undefined;

  constructor() {
    this.init(); // Initialize the Milvus client
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
      await this.listCollections(); // List all collections
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
        auto_id: false,
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
      console.log(data);
      const res = await this._client?.insert(data);
      return res;
    } catch (error) {
      throw error;
    }
  }
}

// Create a singleton instance of the Milvus class
const milvus = new Milvus();

export { milvus };
