import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderLlmsTxt } from "../llm";

export const GET = (async ({ request }) => (
  new Response(renderLlmsTxt(await getCollection("docs"), new URL(request.url)), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
)) satisfies APIRoute;
