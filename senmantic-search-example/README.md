# Semantic Search

In this example we will see how to use Milvus or Zilliz Cloud for semantic search.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nameczz/milvus-node-demos/tree/master/senmantic-search-example&repository-name=senmantic-search-example&env=URI,TOKEN)

## Setup

Prerequisites:

- `Nodejs` >= 18.0.0
- `Next` >= 14.1.0

Clone the repository and install the dependencies.

```
git clone git@github.com:zilliztech/semantic-search-example.
cd semantic-search-example
yarn
```

## Configuration

In order to run this example, you have to supply the Milvus/[Zilliz cloud token](https://docs.zilliz.com/docs/manage-api-keys) needed to interact with the Milvus.

```
URI=YOUR_MILVUS_URI
TOKEN=USERNAME:PASSWORD or api key
```

If using publish on Vercel , you need to set the corresponding environment variables in Vercel's settings.

## Build

To build the project please run the command:

```
npm run build
```

## Application structure

### Utilities

- `embedder`: This utility transforms natural language strings into vector embeddings. It utilizes the Xenova/all-MiniLM-L6-v2 model for this transformation.
- `milvus`: This utility is responsible for establishing a connection with Milvus. It also provides functions to search and insert data, as well as to create collections.
