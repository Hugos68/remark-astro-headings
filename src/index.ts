import { generateHeadings } from './generate-headings.js';
import type { Transformer } from 'unified';

export type Config = {
	minDepth?: number;
	maxDepth?: number;
};

export function remarkAstroHeadings(config: Config = {}): Transformer {
	return function (root, VFile) {
		const filePath = VFile.history[0];
		const headings = generateHeadings(root, {
			minDepth: config.minDepth,
			maxDepth: config.maxDepth,
			filePath,
		});
		if (VFile.data.astro) {
			// @ts-ignore - If `astro` is present then frontmatter is also present
			VFile.data.astro.frontmatter.headings = headings;
		}
	};
}
