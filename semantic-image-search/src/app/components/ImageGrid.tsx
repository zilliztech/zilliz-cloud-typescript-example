import Image from "next/image";
import { blurHashToDataURL } from "../utils/image";
import { Button } from "@nextui-org/react";

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
  setImgUrl: (url: string) => void;
}

/**
 * Renders a grid of images.
 *
 * @param props - The component props.
 * @param props.images - An array of image objects.
 * @param props.setImgUrl - A function to set the image URL.
 * @returns The rendered ImageGrid component.
 */
export function ImageGrid(props: ImageGridProps) {
  const { images, setImgUrl } = props;
  return (
    <div className="columns-2 gap-4 sm:columns-3 xl:columns-4 2xl:columns-5">
      {images.map((v) => (
        <div
          key={v.id}
          className="after:content group  relative mb-4 block w-full after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
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
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-2 bg-black bg-opacity-50 group-hover:h-10 h-0 transition-height duration-500 ease-in-out overflow-hidden ">
            <p className="text-sm h-full flex items-center  ">
              Score: {v.score}
            </p>
            <Button
              isIconOnly
              variant="light"
              aria-label="Search by this image"
              size="sm"
              onClick={() => setImgUrl(v.url)}
            >
              <svg
                aria-hidden="true"
                height="16"
                viewBox="0 0 16 16"
                version="1.1"
                width="16"
                data-view-component="true"
                fill="#fff"
              >
                <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
              </svg>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
