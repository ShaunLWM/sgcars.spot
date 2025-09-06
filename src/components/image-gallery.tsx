import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Masonry } from 'masonic'
import { GalleryService } from '../services/gallery-service'
import { GalleryImage } from './gallery-image'
import { ImageModal } from './image-modal'
import type { ImageData } from '../types/gallery'

export const ImageGallery = () => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery-images'] as const,
    queryFn: GalleryService.fetchImages,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading images...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-500">Failed to load images</div>
      </div>
    )
  }

  const images = data?.images || []

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">No images found</div>
      </div>
    )
  }

  return (
    <>
      <Masonry
        items={images}
        columnGutter={16}
        columnWidth={300}
        overscanBy={5}
        render={({ data: image }) => (
          <GalleryImage 
            image={image} 
            onClick={setSelectedImage}
          />
        )}
      />
      
      {selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}