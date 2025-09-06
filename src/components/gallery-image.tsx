import { useState } from 'react'
import type { ImageData } from '../types/gallery'

type GalleryImageProps = {
  image: ImageData
  onClick: () => void
}

export const GalleryImage = ({ image, onClick }: GalleryImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)

  const thumbSrc = `/img/thumb/${image.f}`

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded bg-gray-100 transition-transform hover:scale-[1.02]"
      style={{ aspectRatio: `${image.tw}/${image.th}` }}
    >
      <img
        src={thumbSrc}
        alt=""
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  )
}