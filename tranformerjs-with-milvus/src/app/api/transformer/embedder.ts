import { AllTasks, pipeline } from "@xenova/transformers";

class Embedder {
  private pipe: AllTasks["feature-extraction"] | null = null;

  // Initialize the pipeline
  async init() {
    this.pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("-- init done ---");
  }

  // Embed a single string
  async embed(text: string) {
    if (!this.pipe) {
      await this.init();
    }
    const result =
      this.pipe &&
      (await this.pipe(text, { pooling: "mean", normalize: true }));
    return {
      text,
      values: Array.from(result?.data || []),
    };
  }

  // // Batch an array of string and embed each batch
  // // Call onDoneBatch with the embeddings of each batch
  // async embedBatch(
  //   texts: string[],
  //   batchSize: number,
  //   onDoneBatch: (embeddings: PineconeRecord<TextMetadata>[]) => void
  // ) {
  //   console.log("-- start batch ---");
  //   const batches = sliceIntoChunks<string>(texts, batchSize);
  //   for (const batch of batches) {
  //     const embeddings = await Promise.all(
  //       batch.map((text) => this.embed(text))
  //     );
  //     await onDoneBatch(embeddings);
  //   }
  // }
}

const embedder = new Embedder();

export { embedder };
