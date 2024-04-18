import {
  env,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  AutoProcessor,
  RawImage,
  CLIPVisionModelWithProjection,
} from "@xenova/transformers";

console.log("---- worker init ----");
// Skip local model check
env.allowLocalModels = false;

/**
 * Represents a singleton class for the application.
 */
class ApplicationSingleton {
  static model_id = "Xenova/clip-vit-base-patch16";
  static BASE_URL =
    "https://huggingface.co/datasets/Xenova/semantic-image-search-assets/resolve/main/";

  static tokenizer = null;
  static processor = null;
  static text_model = null;
  static vision_model = null;

  /**
   * Returns an instance of the ApplicationSingleton class.
   * @param {Function} progress_callback - The progress callback function.
   * @returns {Promise<Array>} A promise that resolves to an array containing the tokenizer, text model, vision model, and processor.
   */
  static async getInstance(progress_callback = null) {
    // Load tokenizer and text model
    if (this.tokenizer === null) {
      this.tokenizer = AutoTokenizer.from_pretrained(this.model_id, {
        progress_callback,
      });
    }
    if (this.processor === null) {
      this.processor = AutoProcessor.from_pretrained(this.model_id, {
        progress_callback,
      });
    }
    if (this.text_model === null) {
      this.text_model = CLIPTextModelWithProjection.from_pretrained(
        this.model_id,
        { progress_callback }
      );
    }
    if (this.vision_model === null) {
      this.vision_model = CLIPVisionModelWithProjection.from_pretrained(
        this.model_id,
        { quantized: false, progress_callback }
      );
    }

    return Promise.all([
      this.tokenizer,
      this.text_model,
      this.vision_model,
      this.processor,
    ]);
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  // Get the tokenizer, model, metadata, and embeddings. When called for the first time,
  // this will load the files and cache them for future use.
  const [tokenizer, text_model, vision_model, process] =
    await ApplicationSingleton.getInstance(self.postMessage);

  // Send the output back to the main thread
  self.postMessage({ status: "ready" });

  const { text } = event.data;

  if (text.includes("https://")) {
    const image = await RawImage.read(text);
    const image_inputs = await process(image);
    const { image_embeds } = await vision_model(image_inputs);
    const imageVector = image_embeds.tolist()[0];
    self.postMessage({
      status: "complete",
      output: imageVector,
    });

    return;
  }

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
