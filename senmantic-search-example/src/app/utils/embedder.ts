import { AllTasks, pipeline } from "@xenova/transformers";

class Embedder {
  private pipe: AllTasks["feature-extraction"] | null = null;

  // Initialize the pipeline
  async init() {
    this.pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
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
}

const embedder = new Embedder();

export { embedder };
