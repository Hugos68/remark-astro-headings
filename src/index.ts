import { type Heading, generateHeadings } from './generate-headings.js';
import type { Root } from 'mdast';

type VFile = {
	history: string[];
	data: {
		astro?: {
			frontmatter: {
				headings: Heading[];
			};
		};
	};
};

export type Config = {
	minDepth?: number;
	maxDepth?: number;
};

export function remarkAstroHeadings(config: Config = {}) {
	return function (root: Root, VFile: VFile) {
		const filePath = VFile.history[0];
		const headings = generateHeadings(root, {
			minDepth: config.minDepth,
			maxDepth: config.maxDepth,
			filePath,
		});
		if (VFile.data.astro) {
			VFile.data.astro.frontmatter.headings = headings;
		}
	};
}
