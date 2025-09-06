import type { GalleryData } from '../types/gallery'

export const GalleryService = {
  async fetchImages(): Promise<GalleryData> {
    const response = await fetch('/data.json')
    if (!response.ok) {
      throw new Error('Failed to fetch gallery data')
    }
    return response.json()
  }
} as const