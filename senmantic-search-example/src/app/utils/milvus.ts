import {
  InsertReq,
  MilvusClient,
  QueryReq,
  SearchSimpleReq,
} from "@zilliz/milvus2-sdk-node";

const DIM = 384; // model Xenova/all-MiniLM-L6-v2 embedding dimension
export const COLLECTION_NAME = "transformerjs_with_milvus";
export const VECTOR_FIELD_NAME = "vector";
export const METRIC_TYPE = "COSINE";
export const INDEX_TYPE = "AUTOINDEX";

export enum CSV_KEYS {
  ID = "id",
  QUESTION = "question",
  ANSWER = "answer",
}

class Milvus {
  private _client: MilvusClient | undefined;

  constructor() {
    this.init();
  }

  public getClient() {
    return this._client;
  }

  public async hasCollection() {
    return await this._client?.hasCollection({
      collection_name: COLLECTION_NAME,
    });
  }

  public async init() {
    try {
      this._client = new MilvusClient({
        address: process.env.URI || "",
        token: process.env.TOKEN,
        channelOptions: {
          "grpc.keepalive_time_ms": 30000, // Adjust the time interval between pings
          "grpc.keepalive_timeout_ms": 5000, // Adjust the time to wait for a response to a ping
        },
      });
      await this.listCollections();
      return await this.createCollection();
    } catch (error) {
      throw error;
    }
  }

  public async createCollection() {
    try {
      const res = await this.hasCollection();
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

  public async listCollections() {
    const res = await this._client?.listCollections();
    return res;
  }

  public async query(data: QueryReq) {
    return await this._client?.query(data);
  }

  public async search(data: SearchSimpleReq) {
    return await this._client?.search({
      ...data,
    });
  }

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

const milvus = new Milvus();

export { milvus };
