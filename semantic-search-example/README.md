# Semantic Search

In this example we will see how to use Milvus or Zilliz Cloud for semantic search.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com//zilliztech/zilliz-cloud-typescript-example/tree/master/semantic-search-example&repository-name=semantic-search-example&env=URI,TOKEN)

## Setup

Prerequisites:

- `Nodejs` >= 18.0.0
- `Next` >= 14.1.0

Clone the repository and install the dependencies.

```
git clone git@github.com:zilliztech/zilliz-cloud-typescript-example
cd zilliz-cloud-typescript-example
yarn
```

## Configuration

To successfully run this example, you must provide the [Milvus](https://milvus.io/docs/quickstart.md)/[Zilliz Cloud](https://docs.zilliz.com/docs/quick-start) URI to establish a connection with Milvus. Additionally, if authentication is enabled, you will also need to supply a valid token.

```
URI=YOUR_MILVUS_URI
TOKEN=USERNAME:PASSWORD or zilliz cloud api key
```

If you are running the example locally, set the above environment variables in the `.env.local` file (for `yarn dev`)

If using publish on Vercel , you need to set the corresponding environment variables in Vercel's settings.

## Build

To build the project please run the command:

```
npm run build
npm run start
```

## Application structure

### Utilities

- `embedder`: This class leverages a pipeline from the [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers) library to generate embeddings from the input text. It employs the [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) model for this transformation. And it offers a method to generate embeddings from a single string.

```javascript
import { AllTasks, pipeline } from "@xenova/transformers";

// Embedder class for feature extraction
class Embedder {
  // Declare a pipeline for feature extraction
  private pipe: AllTasks["feature-extraction"] | null = null;

  // Initialize the pipeline
  async init() {
    // The pipeline is initialized with the "feature-extraction" task and the "Xenova/all-MiniLM-L6-v2" model
    this.pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  // Method to embed a single string
  async embed(text: string) {
    // If the pipeline is not initialized, initialize it
    if (!this.pipe) {
      await this.init();
    }
    // Use the pipeline to extract features from the text
    const result =
      this.pipe &&
      (await this.pipe(text, { pooling: "mean", normalize: true }));
    // Return an object with the original text and the extracted features
    return {
      text,
      values: Array.from(result?.data || []),
    };
  }
}

// Create a singleton instance of the Embedder class
const embedder = new Embedder();

// Export the embedder instance
export { embedder };

```

- `milvus.ts`: This class leverages the [@zilliz/milvus2-sdk-node](https://github.com/milvus-io/milvus-sdk-node) to interact with Milvus. It provides functions for data search, insertion, and collection creation. The batchInsert function allows for batch uploads and offers progress tracking capabilities.

```javascript
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
    // URI is required to connect to Milvus, TOKEN is optional
    if (!process.env.URI) {
      throw new Error("URI is required, please check your .env file.");
    }

    try {
      // Create a new Milvus client
      this._client = new MilvusClient({
        address: process.env.URI || "",
        token: process.env.TOKEN,
        channelOptions: {
          // starter cluster will throw rejected by server because of excess ping, so we need to adjust the ping interval
          "grpc.keepalive_time_ms": 40000, // Adjust the time interval between pings
          "grpc.keepalive_timeout_ms": 5000, // Adjust the time to wait for a response to a ping
        },
      });
      // Create a new collection
      return await this.createCollection();
    } catch (error) {
      throw error;
    }
  }

  // Create a new collection
  public async createCollection() {
    try {
      // Check if the collection exists
      const res = await this.hasCollection();
      if (res?.value) {
        return res;
      }
      // Create a new collection
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

  // Insert data in batches, for example, 1000 data, insert 100 each time
  public async batchInsert(
    texts: { [key in CSV_KEYS]: string }[],
    startIndex: number
  ): Promise<MutationResult | undefined> {
    try {
      // Total number of texts to be inserted
      const total = texts.length;
      // Calculate the end index for the current batch
      const endIndex = startIndex + this._MAX_INSERT_COUNT;
      // Slice the texts array to get the current batch
      const insertTexts = texts.slice(startIndex, endIndex);
      // Set the inserting flag to true
      this._is_inserting = true;

      // If it's the first batch, reset the progress
      if (startIndex === 0) {
        this._insert_progress = 0;
      }
      // Array to hold the data to be inserted
      const insertDatas = [];
      for (let i = 0; i < insertTexts.length; i++) {
        const row = insertTexts[i] as any;
        // Embed the question into a vector using the all-MiniLM-L6-v2 module
        const data = await embedder.embed(row[CSV_KEYS.QUESTION]);

        // Prepare the data to be inserted into the Milvus collection
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


      // Insert the data into Milvus
      const res = await milvus.insert({
        fields_data: insertDatas,
        collection_name: COLLECTION_NAME,
      });
      // Update the progress
      this._insert_progress = Math.floor((endIndex / total) * 100);

      // If not all data has been inserted, continue inserting
      if (endIndex < total) {
        return await this.batchInsert(texts, endIndex + 1);
      }
      // If all data has been inserted, update the progress and inserting flag
      this._insert_progress = 100;
      this._is_inserting = false;
      return res;
    } catch (error) {
      this._insert_progress = 0;
      this._is_inserting = false;
      this._error_msg = (error as any).message || "Insert failed";
    }
  }

  // Get the progress of the insert operation
  get insertProgress() {
    return this._insert_progress;
  }

  // Check if data is being inserted
  get isInserting() {
    return this._is_inserting;
  }

  // Get the error message
  get errorMsg() {
    return this._error_msg;
  }
}

// Create a singleton instance of the Milvus class
const milvus = new Milvus();

export { milvus };

```

### APIs

- `/api/milvus`: This endpoint establishes a connection to Milvus, creates a collection named `semantic_search_example`, sets up an AUTO_INDEX index, and loads the collection into memory.

- `/api/milvus/insert`: This endpoint embeds a single text and inserts it into the collection.

- `/api/milvus/loadCsv`: This endpoint processes the local file `/public/test.csv`, originally sourced from [Kaggle](https://www.kaggle.com/datasets/veeralakrishna/questionanswer-combination). It transforms the 'question' field into a vector and asynchronously imports the data into the Milvus collection in batches. The progress of the import operation can be monitored via the `/api/milvus/loadCsv/progress` endpoint.

- `/api/milvus/search`: This endpoint takes text from the body of the request, embeds it, and performs a search within the Milvus collection.

### Pages

- `layout.tsx`: This file uses NextUIProvider as the provider, enabling the use of next-ui.

- `page.tsx`: This file must be a server component. It embeds the `hello world` string during the build process, which allows for the download of the `Xenova/all-MiniLM-L6-v2` model.

- `search.tsx`: This file provides a straightforward semantic search UI, enabling users to perform semantic searches and insert their own data.

### Next config

Since Milvus operates as a gRPC server, it's necessary to include `@zilliz/milvus2-sdk-node` in the `serverComponentsExternalPackages`. The packages `sharp` and `onnxruntime-node` are dependencies of `@xenova/transformers`. As Vercel APIs are serverless, the [outputFileTracingIncludes config](https://nextjs.org/docs/pages/api-reference/next-config-js/output#caveats) must be specified.

```javascript
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,

  // Indicate that these packages should not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: [
      "sharp",
      "onnxruntime-node",
      "@zilliz/milvus2-sdk-node",
    ],
    outputFileTracingIncludes: {
      // When deploying to Vercel, the following configuration is required
      "/api/**/*": ["node_modules/@zilliz/milvus2-sdk-node/dist/proto/**/*"],
    },
  },
};

module.exports = nextConfig;
```
