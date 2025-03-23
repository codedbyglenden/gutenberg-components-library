const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sass = require('sass');
const postcss = require('postcss');
const cssnano = require('cssnano');

// Configuration
const config = {
	blocksDir: './blocks',
	outputDir: './dist',
	githubPagesRepo: 'gutenberg-components-library',
	githubUsername: 'codedbyglenden',
};

// Create output directory
if (!fs.existsSync(config.outputDir)) {
	fs.mkdirSync(config.outputDir, { recursive: true });
}

// Get all block directories
const blockDirs = fs.readdirSync(config.blocksDir, { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

// Process each block
blockDirs.forEach(blockName => {
	const blockDir = path.join(config.blocksDir, blockName);
	const outputBlockDir = path.join(config.outputDir, 'blocks', blockName);
	
	// Create output directory for this block
	fs.mkdirSync(outputBlockDir, { recursive: true });
	
	// Copy TSX file
	const tsxPath = path.join(blockDir, 'block.tsx');
	if (fs.existsSync(tsxPath)) {
		fs.copyFileSync(tsxPath, path.join(outputBlockDir, 'block.tsx'));
		console.log(`✓ Copied ${blockName}/block.tsx`);
	}
	
	// Process SCSS file
	const scssPath = path.join(blockDir, 'block.scss');
	if (fs.existsSync(scssPath)) {
		try {
			// Compile SCSS to CSS
			const scssContent = fs.readFileSync(scssPath, 'utf8');
			const result = sass.compileString(scssContent);
			
			// Minify CSS
			postcss([cssnano()])
			.process(result.css, { from: undefined })
			.then(result => {
				fs.writeFileSync(path.join(outputBlockDir, 'block.css'), result.css);
				console.log(`✓ Compiled ${blockName}/block.scss to CSS`);
			});
			
			// Also copy the original SCSS for reference
			fs.copyFileSync(scssPath, path.join(outputBlockDir, 'block.scss'));
		} catch (error) {
			console.error(`✗ Error processing ${blockName}/block.scss:`, error);
		}
	}
	
	// Copy metadata
	const metadataPath = path.join(blockDir, 'metadata.json');
	if (fs.existsSync(metadataPath)) {
		fs.copyFileSync(metadataPath, path.join(outputBlockDir, 'metadata.json'));
		console.log(`✓ Copied ${blockName}/metadata.json`);
	}
});

// Create manifest file
const manifest = {
	name: "Gutenberg Blocks Library",
	description: "A collection of custom Gutenberg blocks for WordPress",
	version: "1.0.0",
	lastUpdated: new Date().toISOString(),
	baseUrl: `https://${config.githubUsername}.github.io/${config.githubPagesRepo}`,
	blocks: blockDirs.map(blockName => {
		const metadataPath = path.join(config.blocksDir, blockName, 'metadata.json');
		let metadata = {};
		
		if (fs.existsSync(metadataPath)) {
			metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
		}
		
		return {
			name: blockName,
			title: metadata.title || blockName,
			description: metadata.description || '',
			paths: {
				tsx: `/blocks/${blockName}/block.tsx`,
				scss: `/blocks/${blockName}/block.scss`,
				css: `/blocks/${blockName}/block.css`,
				metadata: `/blocks/${blockName}/metadata.json`
			}
		};
	})
};

fs.writeFileSync(
	path.join(config.outputDir, 'manifest.json'),
	JSON.stringify(manifest, null, 2)
);
console.log('✓ Created manifest.json');

// Create documentation page
const docsHtml = `



  
  
  ${manifest.name}
  
	body {
	  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	  max-width: 1000px;
	  margin: 0 auto;
	  padding: 2rem;
	  line-height: 1.6;
	}
	.block-list {
	  display: grid;
	  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	  gap: 1.5rem;
	}
	.block-card {
	  border: 1px solid #eee;
	  border-radius: 5px;
	  padding: 1.5rem;
	  transition: box-shadow 0.2s;
	}
	.block-card:hover {
	  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
	}
	code {
	  background: #f5f5f5;
	  padding: 0.2rem 0.4rem;
	  border-radius: 3px;
	  font-size: 0.9rem;
	}
	.links {
	  margin-top: 1rem;
	  display: flex;
	  gap: 0.5rem;
	}
	.links a {
	  display: inline-block;
	  padding: 0.2rem 0.5rem;
	  background: #f5f5f5;
	  border-radius: 3px;
	  text-decoration: none;
	  color: #333;
	  font-size: 0.9rem;
	}
  


  ${manifest.name}
  ${manifest.description}
  Last updated: ${new Date(manifest.lastUpdated).toLocaleString()}
  
  Available Blocks
  
	${manifest.blocks.map(block => `
	  
		${block.title}
		${block.description || 'No description provided.'}
		
		  TSX
		  SCSS
		  CSS
		  Metadata
		
	  
	`).join('')}
  
  
  How to Use
  These blocks can be consumed by a Next.js application by fetching them from this GitHub Pages endpoint.
  Base URL: ${manifest.baseUrl}
  
  Usage Example
  // Fetch block component and styles
const fetchBlock = async (blockName) => {
  const [componentResponse, stylesResponse] = await Promise.all([
	fetch(\`${manifest.baseUrl}/blocks/\${blockName}/block.tsx\`),
	fetch(\`${manifest.baseUrl}/blocks/\${blockName}/block.css\`)
  ]);
  
  return {
	component: await componentResponse.text(),
	styles: await stylesResponse.text()
  };
};


`;

fs.writeFileSync(path.join(config.outputDir, 'index.html'), docsHtml);
console.log('✓ Created documentation page');

console.log('Build completed successfully!');