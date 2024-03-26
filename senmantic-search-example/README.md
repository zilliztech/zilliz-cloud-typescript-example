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
