/// <reference types="mdast-util-mdxjs-esm" />
import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import type { Node, Root } from 'mdast';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';

const IMPORT_PATH_REGEX = /from\s+['"]([^'"]+)['"]/;

type Heading = {
	depth: number;
	content: string;
	slug: string;
};

type Config = {
	filePath: string;
	minDepth?: number;
	maxDepth?: number;
	slugger?: GithubSlugger;
	headings?: Heading[];
};

export function generateHeadings(
	root: Node,
	{
		minDepth = 2, // By default skip titles (# / h1)
		maxDepth = 6,
		filePath,
		slugger = new GithubSlugger(),
		headings = [],
	}: Config,
) {
	visit(root as Root, ['heading', 'mdxjsEsm'], (child) => {
		if (child.type === 'heading') {
			const depth = child.depth;
			const content = 'value' in child.children[0] && child.children[0].value;
			if (depth < minDepth || depth > maxDepth || !content) {
				return;
			}
			const slug = slugger.slug(content);
			headings.push({
				depth,
				content,
				slug,
			});
		} else if (child.type === 'mdxjsEsm') {
			const match = child.value.match(IMPORT_PATH_REGEX);
			if (match) {
				const importPath = match[1];
				const file = readFileSync(join(filePath, '..', importPath), 'utf-8');
				const ast = fromMarkdown(file);
				generateHeadings(ast, {
					minDepth,
					maxDepth,
					filePath,
					slugger,
					headings,
				});
			}
		}
	});
	return headings;
}
