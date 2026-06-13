const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    // 1. Install sharp if not present
    try {
        require('sharp');
        console.log("Sharp is already installed.");
    } catch (e) {
        console.log("Installing sharp for high-performance image compression...");
        try {
            execSync('npm install sharp --no-save', { stdio: 'inherit' });
        } catch (installErr) {
            console.error("Failed to install sharp. We will use fallback if available.", installErr);
            process.exit(1);
        }
    }

    const sharp = require('sharp');

    const imagesDir = path.join(__dirname, 'images', 'products');
    const files = fs.readdirSync(imagesDir);

    let siteData = fs.readFileSync('site_data.js', 'utf8');

    for (const file of files) {
        if (file.toLowerCase().endsWith('.png')) {
            const inputPath = path.join(imagesDir, file);
            const outputName = file.substring(0, file.length - 4) + '.webp';
            const outputPath = path.join(imagesDir, outputName);

            console.log(`Converting ${file} to WebP...`);
            
            try {
                // Convert using sharp
                await sharp(inputPath)
                    .webp({ quality: 80 }) // 80 quality is extremely good and ~90% smaller than PNG
                    .toFile(outputPath);

                console.log(`Successfully converted ${file} -> ${outputName}`);
                
                // Delete original PNG file
                fs.unlinkSync(inputPath);
                console.log(`Deleted original file: ${file}`);

                // Update site_data.js references
                const oldRef = `/images/products/${file}`;
                const newRef = `/images/products/${outputName}`;
                siteData = siteData.split(oldRef).join(newRef);
            } catch (err) {
                console.error(`Error converting ${file}:`, err);
            }
        }
    }

    // Write updated site_data.js
    fs.writeFileSync('site_data.js', siteData, 'utf8');
    console.log("Updated site_data.js image paths.");
}

main().catch(err => {
    console.error("Conversion script failed:", err);
});
