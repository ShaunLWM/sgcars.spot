import { readdir, readFile, writeFile, mkdir, unlink } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

const UPLOADS_DIR = '../../uploads'
const FULL_DIR = '../../public/img/full'
const THUMB_DIR = '../../public/img/thumb'
const DATA_FILE = '../../public/data.json'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
const MAX_DIMENSION = 1920
const THUMB_MAX_WIDTH = 500
const QUALITY = 85

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

async function convertHeicToJpeg(inputPath) {
  const inputBuffer = await readFile(inputPath)
  const jpegBuffer = await heicConvert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 1
  })
  return jpegBuffer
}

async function getImageBuffer(inputPath, filename) {
  const ext = extname(filename).toLowerCase()
  
  if (ext === '.heic' || ext === '.heif') {
    console.log(`Converting HEIC: ${filename}`)
    return await convertHeicToJpeg(inputPath)
  } else {
    return await readFile(inputPath)
  }
}

async function processImage(inputPath, filename) {
  try {
    const timestamp = Date.now()
    const id = `${Math.floor(timestamp / 1000)}-${Math.random().toString(36).substr(2, 6)}`
    const outputName = `${basename(filename, extname(filename))}.webp`
    
    const fullPath = join(FULL_DIR, outputName)
    const thumbPath = join(THUMB_DIR, outputName)
    
    // Get image buffer (convert HEIC if needed)
    const imageBuffer = await getImageBuffer(inputPath, filename)
    
    // Get original metadata for orientation-aware resizing
    const metadata = await sharp(imageBuffer).metadata()
    const { width: originalWidth, height: originalHeight } = metadata
    
    // Determine resize options based on orientation
    let resizeOptions = {}
    if (originalWidth > originalHeight) {
      // Landscape: limit by width
      resizeOptions = { 
        width: Math.min(MAX_DIMENSION, originalWidth),
        withoutEnlargement: true,
        fit: 'inside'
      }
    } else {
      // Portrait or square: limit by height
      resizeOptions = { 
        height: Math.min(MAX_DIMENSION, originalHeight),
        withoutEnlargement: true,
        fit: 'inside'
      }
    }
    
    // Process full image
    const fullImage = await sharp(imageBuffer)
      .resize(resizeOptions)
      .webp({ quality: QUALITY })
      .toFile(fullPath)
    
    // Process thumbnail
    const thumbImage = await sharp(imageBuffer)
      .resize(THUMB_MAX_WIDTH, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: QUALITY })
      .toFile(thumbPath)
    
    return {
      id,
      f: outputName,
      w: fullImage.width,
      h: fullImage.height,
      tw: thumbImage.width,
      th: thumbImage.height,
      t: Math.floor(timestamp / 1000)
    }
  } catch (err) {
    throw new Error(`Failed to process ${filename}: ${err.message}`)
  }
}

async function isImageFile(filename) {
  const ext = extname(filename).toLowerCase()
  return SUPPORTED_FORMATS.includes(ext)
}

async function cleanupUploads() {
  try {
    const files = await readdir(UPLOADS_DIR)
    const filesToDelete = files.filter(file => file !== '.gitkeep')
    
    for (const file of filesToDelete) {
      await unlink(join(UPLOADS_DIR, file))
    }
    
    console.log(`✓ Cleaned up ${filesToDelete.length} files from uploads`)
  } catch (err) {
    console.error('Error cleaning up uploads:', err.message)
  }
}

async function main() {
  try {
    // Ensure output directories exist
    await ensureDir(FULL_DIR)
    await ensureDir(THUMB_DIR)
    
    // Read existing data
    let galleryData = { images: [] }
    try {
      const dataContent = await readFile(DATA_FILE, 'utf8')
      galleryData = JSON.parse(dataContent)
    } catch (err) {
      console.log('No existing data.json found, creating new one')
    }
    
    // Check if uploads directory exists
    if (!existsSync(UPLOADS_DIR)) {
      console.log('No uploads directory found')
      return
    }
    
    // Get all files in uploads
    const files = await readdir(UPLOADS_DIR)
    const allFiles = files.filter(file => file !== '.gitkeep')
    
    if (allFiles.length === 0) {
      console.log('No files to process in uploads')
      return
    }
    
    console.log(`Found ${allFiles.length} files in uploads...`)
    
    // Process each file
    const newImages = []
    for (const file of allFiles) {
      try {
        const inputPath = join(UPLOADS_DIR, file)
        
        // Check if it's an image file
        if (!(await isImageFile(file))) {
          console.log(`⚠ Skipping non-image file: ${file}`)
          continue
        }
        
        console.log(`Processing: ${file}`)
        const imageData = await processImage(inputPath, file)
        newImages.push(imageData)
        
        console.log(`✓ Processed: ${file} -> ${imageData.f}`)
      } catch (err) {
        console.error(`✗ ${err.message}`)
      }
    }
    
    // Update gallery data (newest first)
    if (newImages.length > 0) {
      galleryData.images = [...newImages, ...galleryData.images]
      
      // Write updated data
      await writeFile(DATA_FILE, JSON.stringify(galleryData, null, 2))
      
      console.log(`✓ Updated data.json with ${newImages.length} new images`)
      console.log(`Total images in gallery: ${galleryData.images.length}`)
    } else {
      console.log('No images were processed')
    }
    
    // Clean up uploads folder
    await cleanupUploads()
    
  } catch (err) {
    console.error('Error processing images:', err)
    process.exit(1)
  }
}

main()