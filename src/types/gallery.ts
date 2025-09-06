export type ImageData = {
  id: string;      // timestamp-hash
  f: string;       // filename (without path)
  w: number;       // full width
  h: number;       // full height
  tw: number;      // thumb width
  th: number;      // thumb height
  t: number;       // timestamp (unix)
}

export type GalleryData = {
  images: ImageData[];
}