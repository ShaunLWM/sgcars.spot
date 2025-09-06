import { useQuery } from '@tanstack/react-query'
import { Masonry } from 'masonic'
import { useEffect, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox-lite'
import 'yet-another-react-lightbox-lite/styles.css'
import { GalleryService } from '../services/gallery-service'
import { GalleryImage } from './gallery-image'

const useResponsiveColumnWidth = () => {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (width < 640) return 150      // Mobile: 2-3 columns
  if (width < 1024) return 160     // Tablet: 4-5 columns  
  return 180                       // Desktop: 6-8 columns
}

export const ImageGallery = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number>()
  const columnWidth = useResponsiveColumnWidth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery-images'] as const,
    queryFn: GalleryService.fetchImages,
  })

  const images = data?.images || []
  
  const slides = images.map(image => ({
      src: `/img/full/${image.f}`,
      width: image.w,
      height: image.h
  }));

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

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">No images found</div>
      </div>
    )
  }

  return (
    <div className="px-2">
      <Masonry
        items={images}
        columnGutter={8}
        columnWidth={columnWidth}
        overscanBy={5}
        render={({ data: image, index }) => (
          <GalleryImage 
            image={image} 
            onClick={() => setLightboxIndex(index)}
          />
        )}
      />
      
      <Lightbox
        slides={slides}
        index={lightboxIndex}
        setIndex={setLightboxIndex}
      />
    </div>
  )
}
