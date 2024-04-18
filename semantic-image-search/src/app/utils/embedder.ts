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
      console.log("----- error", error);
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
