# Semantic Image Search

In this example we will see how to use Milvus or Zilliz Cloud for semantic image search.

## Setup

Prerequisites:

- `Nodejs` >= 18.0.0
- `Next` >= 14.1.0

Clone the repository and install the dependencies.

```
git clone git@github.com:zilliztech/semantic-image-search
cd semantic-image-search
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

- `embedder`: This class leverages a pipeline from the [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers) library to generate embeddings. It employs the [Xenova/clip-vit-base-patch16](https://huggingface.co/Xenova/clip-vit-base-patch16) model for this transformation. And it offers methods to generate embeddings from a single string or image data.

```javascript
import {
  AutoProcessor,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  PreTrainedModel,
  PreTrainedTokenizer,
  Processor,
  RawImage,
} from "@xenova/transformers";

/**
 * The Embedder class provides methods to embed text and images using the CLIP model.
 */
class Embedder {
  private modelId = "Xenova/clip-vit-base-patch16";
  private tokenizer: PreTrainedTokenizer | null = null;
  private textModel: PreTrainedModel | null = null;
  private processor: Processor | null = null;
  private visionModel: PreTrainedModel | null = null;

  /**
   * Initializes the Embedder by loading the tokenizer and models.
   */
  async init() {
    // Load tokenizer and text model
    if (!this.tokenizer) {
      this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
    }

    if (!this.textModel) {
      this.textModel = await CLIPTextModelWithProjection.from_pretrained(
        this.modelId,
        {
          quantized: false,
        }
      );
    }
    if (!this.processor) {
      this.processor = await AutoProcessor.from_pretrained(this.modelId);
    }

    if (!this.visionModel) {
      this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(
        this.modelId,
        {
          quantized: false,
        }
      );
    }
  }

  /**
   * Embeds the given text and returns the query embedding.
   * @param text - The text to embed.
   * @returns The query embedding as an array.
   * @throws If there is an error in embedding the text.
   */
  async embed(text: string) {
    try {
      if (!this.tokenizer || !this.textModel) {
        await this.init();
      }
      // Run tokenization
      let text_inputs = this.tokenizer!(text, {
        padding: true,
        truncation: true,
      });

      // Compute embeddings
      const { text_embeds } = await this.textModel!(text_inputs);
      const query_embedding = text_embeds.tolist()[0];
      return query_embedding;
    } catch (error) {
      throw new Error("Error in embedding text: " + error);
    }
  }

  /**
   * Embeds the image from the given URL and returns the image embedding.
   * @param url - The URL of the image to embed.
   * @returns The image embedding as an array.
   * @throws If there is an error in embedding the image or no image URL is provided.
   */
  async embedImage(url: string) {
    if (!url) {
      throw new Error("No image url provided");
    }
    try {
      if (!this.processor || !this.visionModel) {
        await this.init();
      }
      // read image data
      const rawImage = await RawImage.read(url);

      let image_inputs = await this.processor!(rawImage);

      // Compute embeddings
      const { image_embeds } = await this.visionModel!(image_inputs);
      const imageVector = image_embeds.tolist()[0] || [];
      return imageVector;
    } catch (error) {
      throw new Error("Error in embedding image: " + error);
    }
  }
}

const embedder = new Embedder();

export { embedder };


```

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

- `ImageGrid.tsx`: Renders a grid of images. 

- `layout.tsx`: This file uses NextUIProvider as the provider, enabling the use of next-ui.

- `search.tsx`: This file provides a straightforward semantic search UI, enabling users to perform semantic image searches.


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
