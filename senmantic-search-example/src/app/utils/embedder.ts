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
