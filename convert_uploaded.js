const fs = require('fs');
const path = require('path');

async function main() {
    let sharp;
    try {
        sharp = require('sharp');
    } catch (e) {
        console.error("Failed to load sharp.");
        process.exit(1);
    }

    const filePath = process.argv[2];
    if (!filePath) {
        console.error("No file path specified. Usage: node convert_uploaded.js <filePath>");
        process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        process.exit(1);
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.webp') {
        console.log("File is already in WebP format.");
        process.exit(0);
    }

    if (!['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
        console.error(`Unsupported format: ${ext}`);
        process.exit(1);
    }

    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath, ext);
    const outputPath = path.join(dirName, baseName + '.webp');

    console.log(`Converting upload: ${filePath} -> ${outputPath}`);

    try {
        await sharp(filePath)
            .webp({ quality: 80 })
            .toFile(outputPath);

        console.log(`Successfully converted uploaded image to WebP: ${baseName + '.webp'}`);

        // Delete the original file
        fs.unlinkSync(filePath);
        console.log(`Deleted original uploaded file: ${filePath}`);
    } catch (err) {
        console.error(`Error converting uploaded image ${filePath}:`, err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Upload conversion failed:", err);
    process.exit(1);
});
