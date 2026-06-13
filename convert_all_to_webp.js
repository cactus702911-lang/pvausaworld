const fs = require('fs');
const path = require('path');

async function main() {
    let sharp;
    try {
        sharp = require('sharp');
        console.log("Sharp is loaded successfully.");
    } catch (e) {
        console.error("Failed to load sharp. Please run npm install sharp first.", e);
        process.exit(1);
    }

    // Directories to scan (recursive function will be used)
    const scanDirs = [
        __dirname, // root directory
        path.join(__dirname, 'images')
    ];

    const excludeDirs = [
        'node_modules',
        '.git',
        '.firebase',
        '.vercel',
        '.vscode',
        'blog',
        'category',
        'product',
        'sitemap',
        'empty_redirect'
    ];

    let siteDataChanged = false;
    let siteTemplateChanged = false;

    let siteDataPath = path.join(__dirname, 'site_data.js');
    let siteTemplatePath = path.join(__dirname, 'site_template.html');

    let siteData = fs.existsSync(siteDataPath) ? fs.readFileSync(siteDataPath, 'utf8') : '';
    let siteTemplate = fs.existsSync(siteTemplatePath) ? fs.readFileSync(siteTemplatePath, 'utf8') : '';

    // Function to recursively scan directories
    async function scanAndConvert(dirPath) {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Check if this directory should be excluded
                if (excludeDirs.includes(item)) {
                    continue;
                }
                // Recursively scan subdirectory (if we are in the root directory, don't scan images since it is in scanDirs explicitly, but scan other custom subdirs if any. Actually, scanAndConvert is recursive, so let's just make sure we don't scan double)
                if (dirPath === __dirname && item === 'images') {
                    // images is already explicitly in scanDirs, skip here to avoid double scan
                    continue;
                }
                await scanAndConvert(fullPath);
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                    // Skip favicon.png
                    if (item.toLowerCase() === 'favicon.png') {
                        console.log("Skipping favicon.png");
                        continue;
                    }

                    const baseName = path.basename(item, ext);
                    const outputName = baseName + '.webp';
                    const outputPath = path.join(dirPath, outputName);

                    console.log(`Converting image: ${fullPath} -> ${outputPath}`);
                    try {
                        await sharp(fullPath)
                            .webp({ quality: 80 })
                            .toFile(outputPath);

                        console.log(`Successfully converted to WebP: ${outputName}`);

                        // Delete original image file
                        fs.unlinkSync(fullPath);
                        console.log(`Deleted original file: ${item}`);

                        // Determine relative paths for replacement
                        let relPath = '';
                        if (dirPath === __dirname) {
                            relPath = '/' + item;
                        } else {
                            // Get relative path from root
                            const relativeDir = path.relative(__dirname, dirPath).replace(/\\/g, '/');
                            relPath = '/' + relativeDir + '/' + item;
                        }

                        const oldRef = relPath;
                        const newRef = oldRef.substring(0, oldRef.lastIndexOf('.')) + '.webp';

                        console.log(`Replacing references in code: ${oldRef} -> ${newRef}`);

                        // Update references in site_data.js
                        if (siteData.includes(oldRef)) {
                            siteData = siteData.split(oldRef).join(newRef);
                            siteDataChanged = true;
                        }
                        const altOldRef = oldRef.substring(1); // without leading slash
                        const altNewRef = newRef.substring(1);
                        if (siteData.includes(altOldRef)) {
                            siteData = siteData.split(altOldRef).join(altNewRef);
                            siteDataChanged = true;
                        }

                        // Update references in site_template.html
                        if (siteTemplate.includes(oldRef)) {
                            siteTemplate = siteTemplate.split(oldRef).join(newRef);
                            siteTemplateChanged = true;
                        }
                        if (siteTemplate.includes(altOldRef)) {
                            siteTemplate = siteTemplate.split(altOldRef).join(altNewRef);
                            siteTemplateChanged = true;
                        }

                    } catch (err) {
                        console.error(`Error converting ${item}:`, err);
                    }
                }
            }
        }
    }

    for (const dir of scanDirs) {
        if (fs.existsSync(dir)) {
            console.log(`Scanning directory: ${dir}`);
            await scanAndConvert(dir);
        }
    }

    if (siteDataChanged && siteData) {
        fs.writeFileSync(siteDataPath, siteData, 'utf8');
        console.log("Updated site_data.js references.");
    }
    if (siteTemplateChanged && siteTemplate) {
        fs.writeFileSync(siteTemplatePath, siteTemplate, 'utf8');
        console.log("Updated site_template.html references.");
    }

    console.log("All image conversions complete.");
}

main().catch(err => {
    console.error("Script execution failed:", err);
    process.exit(1);
});
