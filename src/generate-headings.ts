import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";

const IMPORT_PATH_REGEX = /from\s+['"]([^'"]+)['"]/;

export type Heading = {
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
	root: Root,
	{
		minDepth = 2,
		maxDepth = 6,
		filePath,
		slugger = new GithubSlugger(),
		headings = [],
	}: Config,
) {
	visit(root, ["heading", "mdxjsEsm"], (child) => {
		if (child.type === "heading") {
			const depth = child.depth;
			if (depth < minDepth || depth > maxDepth) {
				return;
			}
			const content =
				"value" in child.children[0]
					? child.children[0].value
					: "";
			const slug = slugger.slug(content);
			headings.push({
				depth,
				content,
				slug,
			});
			// @ts-ignore - mdxjsEsm is not in the unist type
		} else if (child.type === "mdxjsEsm") {
			// @ts-ignore - mdxjsEsm is not in the unist type
			const match = child.value.match(IMPORT_PATH_REGEX);
			if (match) {
				const path = match[1];
				const file = readFileSync(
					join(filePath, "..", path),
					"utf-8",
				);
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
