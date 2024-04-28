# Semantic Image Search

In this example we will see how to use Milvus or Zilliz Cloud for semantic image search, and embedding data in browser.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zilliztech/zilliz-cloud-typescript-example/tree/master/semantic-image-search-client&repository-name=semantic-image-search-client&env=URI,TOKEN)

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

### Data Init

To initialize the data, you can use the `loadImages.mjs` script. This script reads the `photo.tsv` which is download from Hugging Face, embeds all the images, and inserts them into the Milvus Collection. Please note that this process may take some time, especially if you have a large number of images.

To run the script, execute the following command:

```
node loadImages.mjs
```

### Utilities

- `milvus.ts`: This class leverages the [@zilliz/milvus2-sdk-node](https://github.com/milvus-io/milvus-sdk-node) to interact with Milvus. It provides functions for data search, insertion, and collection creation. The batchInsert function allows for batch uploads and offers progress tracking capabilities.

```javascript
import {
  InsertReq,
  MilvusClient,
  SearchSimpleReq,
} from "@zilliz/milvus2-sdk-node";

// Define constants for the Milvus client
const DIM = 512; // model Xenova/clip-vit-base-patch16 embedding dimension
export const COLLECTION_NAME = "semantic_image_search"; // example collection name
export const VECTOR_FIELD_NAME = "vector"; // verctor field name
export const METRIC_TYPE = "COSINE";
export const INDEX_TYPE = "AUTOINDEX";

class Milvus {
  private _client: MilvusClient | undefined;

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
}

// Create a singleton instance of the Milvus class
const milvus = new Milvus();

export { milvus };

```

### APIs

- `/api/milvus`: This endpoint establishes a connection to Milvus, creates a collection named `semantic_search_example` with AUTO_INDEX index, COSINE metric type, and loads the collection into memory.

- `/api/milvus/search`: This endpoint takes text from the body of the request, embeds it, and performs a search within the Milvus collection.

### Client

- `worker.js`: This file runs the model in the browser. It requires downloading the model at the first time and supports embedding text and image using the Xenova/clip-vit-base-patch16 model.

- `ImageGrid.tsx`: Renders a grid of images.

- `layout.tsx`: This file uses NextUIProvider as the provider, enabling the use of next-ui.

- `search.tsx`: This file provides a straightforward semantic search UI, enabling users to perform semantic image searches.

### Next config

Since Milvus operates as a gRPC server, it's necessary to include `@zilliz/milvus2-sdk-node` in the `serverComponentsExternalPackages`. The packages `sharp` and `onnxruntime-node` are dependencies of `@xenova/transformers`. As Vercel APIs are serverless, the [outputFileTracingIncludes config](https://nextjs.org/docs/pages/api-reference/next-config-js/output#caveats) must be specified.

```javascript
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    // Ignore node-specific modules when bundling for the browser
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    return config;
  },
  // Indicate that these packages should not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: ["@zilliz/milvus2-sdk-node"],
    outputFileTracingIncludes: {
      // When deploying to Vercel, the following configuration is required
      "/api/**/*": ["node_modules/@zilliz/milvus2-sdk-node/dist/proto/**/*"],
    },
  },
};

module.exports = nextConfig;
```
