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

class Embedder {
  private modelId = "Xenova/clip-vit-base-patch16";
  private tokenizer: PreTrainedTokenizer | null = null;
  private textModel: PreTrainedModel | null = null;
  private processor: Processor | null = null;
  private visionModel: PreTrainedModel | null = null;

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

  async embedImage(url: string) {
    if (!url) {
      throw new Error("No image url provided");
    }
    try {
      if (!this.processor || !this.visionModel) {
        await this.init();
      }
      // Run tokenization
      const rawImage = await RawImage.read(url);

      let image_inputs = await this.processor!(rawImage);

      // Compute embeddings
      const { image_embeds } = await this.visionModel!(image_inputs);
      const imageVector = image_embeds.tolist()[0] || [];
      return imageVector;
    } catch (error) {
      throw new Error("Error in embedding text: " + error);
    }
  }
}

const embedder = new Embedder();

export { embedder };
