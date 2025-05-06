import * as path from "node:path";
import * as fs from "fs-extra";
import sharp from "sharp";

// Define interfaces for our data structures
interface ImageMetadata {
	n: string;
	w: number;
	h: number;
}

const UPLOADS_DIR = path.join(process.cwd(), "apps/app/src/uploads");
const ASSETS_DIR = path.join(process.cwd(), "apps/app/src/assets");
const IMAGES_JSON_PATH = path.join(ASSETS_DIR, "images.json");

// Maximum width/height for web-friendly images
const MAX_SIZE = 1200;

async function processImages(): Promise<void> {
	try {
		console.log("Starting image processing");
		console.log(`Current working directory: ${process.cwd()}`);
		console.log(`Uploads directory: ${UPLOADS_DIR}`);
		console.log(`Assets directory: ${ASSETS_DIR}`);

		// Ensure assets directory exists
		await fs.ensureDir(ASSETS_DIR);
		console.log("Assets directory ensured");

		// Read current images.json
		let imagesData: ImageMetadata[] = [];
		try {
			imagesData = (await fs.readJSON(IMAGES_JSON_PATH)) as ImageMetadata[];
			console.log(`Current images.json contains ${imagesData.length} entries`);
		} catch (error) {
			// If file doesn't exist or is empty, create with empty array
			console.log(
				"Error reading images.json, creating new file:",
				(error as Error).message,
			);
			await fs.writeJSON(IMAGES_JSON_PATH, []);
			console.log("Created new images.json file");
		}

		// Get all files in uploads directory
		const files = await fs.readdir(UPLOADS_DIR);
		console.log(`Found ${files.length} files in uploads directory`);

		// Filter for image files
		const imageFiles = files.filter((file) => {
			const ext = path.extname(file).toLowerCase();
			return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
		});
		console.log(`Found ${imageFiles.length} image files to process`);

		// Process each image
		for (const file of imageFiles) {
			const filePath = path.join(UPLOADS_DIR, file);
			console.log(`Processing image: ${file}`);

			// Generate new filename based on current milliseconds
			const timestamp = Date.now();
			const extension = path.extname(file);
			const newFilename = `${timestamp}${extension}`;
			const outputPath = path.join(ASSETS_DIR, newFilename);
			console.log(`New filename: ${newFilename}`);

			// Get image metadata
			console.log("Getting image metadata");
			const metadata = await sharp(filePath).metadata();
			console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

			if (!metadata.width || !metadata.height) {
				console.error(`Could not get dimensions for ${file}, skipping`);
				continue;
			}

			// Calculate new dimensions to maintain aspect ratio
			let width = metadata.width;
			let height = metadata.height;

			if (width > MAX_SIZE || height > MAX_SIZE) {
				if (width > height) {
					height = Math.round((height / width) * MAX_SIZE);
					width = MAX_SIZE;
				} else {
					width = Math.round((width / height) * MAX_SIZE);
					height = MAX_SIZE;
				}
				console.log(`Resized dimensions: ${width}x${height}`);
			} else {
				console.log("Image is already web-friendly size, not resizing");
			}

			// Resize and save the image
			console.log("Resizing and saving image");
			await sharp(filePath)
				.resize(width, height, { fit: "inside", withoutEnlargement: true })
				.toFile(outputPath);
			console.log("Image saved successfully");

			// Add to images.json
			imagesData.push({
				n: newFilename,
				w: width,
				h: height,
			});
			console.log("Added metadata to images.json");

			// Remove original file from uploads directory
			await fs.remove(filePath);
			console.log(`Removed original file: ${filePath}`);
		}

		// Write updated data back to images.json
		console.log("Writing updated images.json");
		await fs.writeJSON(IMAGES_JSON_PATH, imagesData, { spaces: 2 });
		console.log(`Updated images.json with ${imagesData.length} entries`);

		console.log(`Successfully processed ${imageFiles.length} images`);
	} catch (error) {
		console.error("Error processing images:", error);
		console.error("Stack trace:", (error as Error).stack);
		process.exit(1);
	}
}

processImages();
