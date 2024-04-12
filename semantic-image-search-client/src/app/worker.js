import {
  env,
  AutoTokenizer,
  CLIPTextModelWithProjection,
} from "@xenova/transformers";

console.log("---- worker init ----");
// Skip local model check
env.allowLocalModels = false;

class ApplicationSingleton {
  static model_id = "Xenova/clip-vit-base-patch16";
  static BASE_URL =
    "https://huggingface.co/datasets/Xenova/semantic-image-search-assets/resolve/main/";

  static tokenizer = null;
  static text_model = null;

  static async getInstance(progress_callback = null) {
    // Load tokenizer and text model
    if (this.tokenizer === null) {
      this.tokenizer = AutoTokenizer.from_pretrained(this.model_id, {
        progress_callback,
      });
    }
    if (this.text_model === null) {
      this.text_model = CLIPTextModelWithProjection.from_pretrained(
        this.model_id,
        { progress_callback }
      );
    }

    return Promise.all([this.tokenizer, this.text_model]);
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  // Get the tokenizer, model, metadata, and embeddings. When called for the first time,
  // this will load the files and cache them for future use.
  const [tokenizer, text_model] = await ApplicationSingleton.getInstance(
    self.postMessage
  );

  // Send the output back to the main thread
  self.postMessage({ status: "ready" });

  // Run tokenization
  const text_inputs = tokenizer(event.data.text, {
    padding: true,
    truncation: true,
  });

  // Compute embeddings
  const { text_embeds } = await text_model(text_inputs);
  // Send the output back to the main thread
  self.postMessage({
    status: "complete",
    output: text_embeds.data,
  });
});
