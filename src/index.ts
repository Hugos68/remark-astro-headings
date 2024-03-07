/// <reference types="mdast-util-mdxjs-esm" />
import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { Transformer } from 'unified';
import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown } from 'mdast-util-mdx';

const IMPORT_PATH_REGEX = /from\s+['"]([^'"]+)['"]/;

type AstroHeadingsConfig = {
	minDepth?: number;
	maxDepth?: number;
	createSlugger?: () => { slug: (content: string) => string };
};

function remarkAstroHeadings(config: AstroHeadingsConfig = {}): Transformer<Root> {
	const configWithDefaults = {
		minDepth: 2,
		maxDepth: 6,
		createSlugger: () => new GithubSlugger(),
		...config,
	};
	return generateHeadings(configWithDefaults);
}

function generateHeadings(config: Required<AstroHeadingsConfig>): Transformer<Root> {
	return (root, VFile) => {
		if (!VFile.data.astro) {
			console.warn(`[remark-astro-headings] No astro data found in VFile: ${VFile.path}`);
			return;
		}
		const slugger = config.createSlugger();
		const dir = join(VFile.path, '..');
		const headings = visitDeeply(root, { dir, headings: [], slugger, ...config });
		// @ts-ignore - If `astro` is present then frontmatter is also present
		VFile.data.astro.frontmatter.headings = headings;
	};
}

type VisitRecursivelyConfig = {
	dir: string;
	slugger: { slug: (content: string) => string };
	headings: { content: string; slug: string; depth: number }[];
	minDepth: number;
	maxDepth: number;
};

function visitDeeply(root: Root, config: VisitRecursivelyConfig) {
	visit(root, ['heading', 'mdxjsEsm'], (child) => {
		switch (child.type) {
			case 'heading': {
				const content = 'value' in child.children[0] && child.children[0].value;
				if (!content) {
					break;
				}
				const depth = child.depth;
				if (depth < config.minDepth || depth > config.maxDepth) {
					break;
				}
				const slug = config.slugger.slug(content);
				config.headings.push({
					content,
					slug,
					depth,
				});
				break;
			}
			case 'mdxjsEsm': {
				const match = child.value.match(IMPORT_PATH_REGEX);
				if (!match) {
					break;
				}
				const importPath = match[1];
				const file = readFileSync(join(config.dir, importPath), 'utf-8');
				const root = fromMarkdown(file, {
					extensions: [mdxjs()],
					mdastExtensions: [mdxFromMarkdown()],
				});
				visitDeeply(root, config);
				break;
			}
		}
	});
	return config.headings;
}

export default remarkAstroHeadings;
