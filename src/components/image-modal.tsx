import { useEffect } from 'react'
import type { ImageData } from '../types/gallery'

type ImageModalProps = {
  image: ImageData
  onClose: () => void
}

export const ImageModal = ({ image, onClose }: ImageModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const fullSrc = `/img/full/${image.f}`

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
          aria-label="Close modal"
        >
          ×
        </button>
        
        <img
          src={fullSrc}
          alt=""
          className="max-w-full max-h-full object-contain"
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}