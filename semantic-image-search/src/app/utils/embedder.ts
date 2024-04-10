import {
  AutoTokenizer,
  CLIPTextModelWithProjection,
  PreTrainedModel,
  PreTrainedTokenizer,
} from "@xenova/transformers";

class Embedder {
  private modelId = "Xenova/clip-vit-base-patch16";
  private tokenizer: PreTrainedTokenizer | null = null;
  private textModel: PreTrainedModel | null = null;

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
  }

  async embed(text: string) {
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
    console.log("---- text embeds 1 -----", text_embeds);
    const query_embedding = text_embeds.tolist()[0];
    return query_embedding;
  }
}

const embedder = new Embedder();

export { embedder };
