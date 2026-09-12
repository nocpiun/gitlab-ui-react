import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import {
  docsMarkdownStaticPaths,
  renderDocsMarkdown,
  type DocsContentEntry,
} from "../llm";

export async function getStaticPaths() {
  return docsMarkdownStaticPaths(await getCollection("docs"));
}

export const GET = (({ props }) => (
  new Response(renderDocsMarkdown(props.entry as DocsContentEntry), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
)) satisfies APIRoute;
