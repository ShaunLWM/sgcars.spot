import * as path from "node:path";
import * as fs from "fs-extra";
import sharp from "sharp";

// Define interfaces for our data structures
interface ImageMetadata {
	n: string;
	w: number;
	h: number;
}

// Get workspace directory (root of repository)
const WORKSPACE_DIR = process.env.GITHUB_WORKSPACE || process.cwd();
console.log(`Using workspace directory: ${WORKSPACE_DIR}`);

// Define paths relative to workspace
const UPLOADS_DIR = path.resolve(WORKSPACE_DIR, "apps/app/src/uploads");
const ASSETS_DIR = path.resolve(WORKSPACE_DIR, "apps/app/src/assets");
const IMAGES_JSON_PATH = path.resolve(ASSETS_DIR, "images.json");

// Maximum width/height for web-friendly images
const MAX_SIZE = 1200;

async function processImages(): Promise<void> {
	try {
		console.log("Starting image processing");
		console.log(`Current working directory: ${process.cwd()}`);
		console.log(`Uploads directory: ${UPLOADS_DIR}`);
		console.log(`Assets directory: ${ASSETS_DIR}`);
		console.log(`Images JSON path: ${IMAGES_JSON_PATH}`);

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

		// List all directories and files for debugging
		console.log("\n== DIRECTORY LISTING ==");
		console.log("Workspace directory:");
		console.log(await fs.readdir(WORKSPACE_DIR));
		console.log("\nApps directory:");
		try {
			console.log(await fs.readdir(path.join(WORKSPACE_DIR, "apps")));
		} catch (error) {
			console.error(
				`Error reading apps directory: ${(error as Error).message}`,
			);
		}

		// Get all files in uploads directory
		const files = await fs.readdir(UPLOADS_DIR);
		console.log(`\nFound ${files.length} files in uploads directory`);

		// Filter for image files
		const imageFiles = files.filter((file: string) => {
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
			// Always use .webp extension regardless of original format
			const newFilename = `${timestamp}.webp`;
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

			// Get original file size
			const originalFileStats = await fs.stat(filePath);
			console.log(
				`Original file size: ${(originalFileStats.size / 1024).toFixed(2)} KB`,
			);

			await sharp(filePath)
				.resize(width, height, { fit: "inside", withoutEnlargement: true })
				.webp({ quality: 80 }) // Convert to WebP format with 80% quality
				.toFile(outputPath);

			// Get converted file size
			const convertedFileStats = await fs.stat(outputPath);
			console.log(
				`WebP file size: ${(convertedFileStats.size / 1024).toFixed(2)} KB`,
			);
			console.log(
				`Size reduction: ${(100 - (convertedFileStats.size / originalFileStats.size) * 100).toFixed(2)}%`,
			);
			console.log("Image saved successfully and converted to WebP");

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
