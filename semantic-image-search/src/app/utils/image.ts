import { decode } from "blurhash";

const SIZE = 32;

/**
 * Converts a blur hash to a data URL representing the image.
 * @param hash - The blur hash string.
 * @returns The data URL representing the image.
 */
export function blurHashToDataURL(hash: string) {
  if (!hash) return undefined;

  const pixels = decode(hash, SIZE, SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(SIZE, SIZE);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

