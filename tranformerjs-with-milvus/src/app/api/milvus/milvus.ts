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

class Milvus {
  private _client: MilvusClient;

  constructor() {
    console.log("--- init milvus client ---");
    this._client = new MilvusClient({
      address: "127.0.0.1:19530",
      username: "root",
      password: "Milvus",
    });
    console.log("--- init milvus client done ---");

    this.createCollection();
  }

  public getClient() {
    return this._client;
  }

  public async hasCollection() {
    return this._client.hasCollection({ collection_name: COLLECTION_NAME });
  }

  public async createCollection() {
    const res = await this.hasCollection();
    if (res.value) {
      return;
    }
    await this._client.createCollection({
      collection_name: COLLECTION_NAME,
      dimension: DIM, //
      metric_type: METRIC_TYPE,
      auto_id: false,
    });
    await this._client.createIndex({
      field_name: VECTOR_FIELD_NAME,
      collection_name: COLLECTION_NAME,
      index_type: INDEX_TYPE,
    });
    await this._client.loadCollection({ collection_name: COLLECTION_NAME });
  }

  public async listCollections() {
    return this._client.listCollections();
  }

  public async query(data: QueryReq) {
    return this._client.query(data);
  }

  public async search(data: SearchSimpleReq) {
    return this._client.search({
      ...data,
    });
  }

  public async insert(data: InsertReq) {
    return this._client.insert(data);
  }
}

const milvus = new Milvus();

export { milvus };
