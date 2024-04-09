import Image from "next/image";
import { blurHashToDataURL } from "../utils/image";

export interface ImageType {
  id: string;
  url: string;
  score: number;
  blurHash: string;
  aiDescription: string;
  photoDescription: string;
  ratio: number;
}
interface ImageGridProps {
  images: ImageType[];
}

export function ImageGrid(props: ImageGridProps) {
  const { images } = props;
  return (
    <div className="columns-2 gap-4 sm:columns-3 xl:columns-4 2xl:columns-5">
      {images.map((v) => (
        <div
          key={v.id}
          className="after:content group cursor-pointer relative mb-4 block w-full after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
        >
          <Image
            alt={v.photoDescription || v.aiDescription || ""}
            className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
            style={{ transform: "translate3d(0, 0, 0)" }}
            placeholder="blur"
            blurDataURL={blurHashToDataURL(v.blurHash)}
            src={`${v.url}?auto=format&fit=crop&w=480&q=80`}
            width={480}
            height={480 / v.ratio}
            unoptimized={true}
          />
        </div>
      ))}
    </div>
  );
}
