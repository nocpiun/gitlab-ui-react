import { describe, expect, it, vi } from "vitest";
import {
  createPagefindSearch,
  createWebMcpTools,
  installWebMcpTools,
  normalizeDocsUrl,
  type PagefindModule,
  type PagefindSearchResponse,
  type WebMcpDependencies,
} from "./webmcp";

const currentUrl = new URL("https://glui.nocp.space/docs/components/button");

function pagefindResponse(
  results: Array<{ excerpt?: string; title?: string; url: string }>,
): PagefindSearchResponse {
  return {
    results: results.map(({ excerpt, title, url }) => ({
      data: async () => ({
        meta: title === undefined ? undefined : { title },
        plain_excerpt: excerpt,
        url,
      }),
    })),
  };
}

function createDependencies(overrides: Partial<WebMcpDependencies> = {}): WebMcpDependencies {
  return {
    fetchMarkdown: vi.fn(async () => new Response("# Button\n")),
    getCurrentUrl: () => currentUrl,
    getLocale: () => "en",
    navigateTo: vi.fn(async () => undefined),
    searchDocs: vi.fn(async () => pagefindResponse([])),
    ...overrides,
  };
}

function tool(
  name: "search_docs" | "read_docs" | "open_docs",
  dependencies: WebMcpDependencies,
) {
  const match = createWebMcpTools(dependencies).find((candidate) => candidate.name === name);
  if(match === undefined) throw new Error(`Missing tool: ${name}`);
  return match;
}

function execute(
  selectedTool: WebMCP.ModelContextTool,
  input: Record<string, unknown>,
  signal = new AbortController().signal,
) {
  return selectedTool.execute(input, { signal });
}

describe("normalizeDocsUrl", () => {
  it.each([
    ["/docs", "https://glui.nocp.space/docs", "https://glui.nocp.space/docs.md"],
    ["/docs/", "https://glui.nocp.space/docs", "https://glui.nocp.space/docs.md"],
    [
      "/docs/components/button.md",
      "https://glui.nocp.space/docs/components/button",
      "https://glui.nocp.space/docs/components/button.md",
    ],
    [
      "/zh/docs/components/form-input/#usage",
      "https://glui.nocp.space/zh/docs/components/form-input#usage",
      "https://glui.nocp.space/zh/docs/components/form-input.md",
    ],
  ])("normalizes %s", (input, expectedPageUrl, expectedMarkdownUrl) => {
    const urls = normalizeDocsUrl(input, currentUrl);

    expect(urls.pageUrl.href).toBe(expectedPageUrl);
    expect(urls.markdownUrl.href).toBe(expectedMarkdownUrl);
  });

  it.each([
    "https://example.com/docs/components/button",
    "/",
    "/docs/../admin",
    "/docs/%62utton",
    "/docs/components/Button",
    "/storybook/components/button",
  ])("rejects unsafe or non-documentation URL %s", (input) => {
    expect(() => normalizeDocsUrl(input, currentUrl)).toThrow(TypeError);
  });
});

describe("createPagefindSearch", () => {
  it("initializes once per active locale and reinitializes after a locale change", async () => {
    const pagefind: PagefindModule = {
      destroy: vi.fn(async () => undefined),
      init: vi.fn(async () => undefined),
      search: vi.fn(async () => pagefindResponse([])),
    };
    const search = createPagefindSearch(async () => pagefind);
    const signal = new AbortController().signal;

    await search("button", "en", signal);
    await search("modal", "en", signal);
    await search("按钮", "zh", signal);

    expect(pagefind.init).toHaveBeenCalledTimes(2);
    expect(pagefind.destroy).toHaveBeenCalledTimes(1);
    expect(pagefind.search).toHaveBeenNthCalledWith(1, "button");
    expect(pagefind.search).toHaveBeenNthCalledWith(2, "modal");
    expect(pagefind.search).toHaveBeenNthCalledWith(3, "按钮");
  });

  it("does not load Pagefind for an already cancelled call", async () => {
    const loadPagefind = vi.fn<() => Promise<PagefindModule>>();
    const search = createPagefindSearch(loadPagefind);
    const controller = new AbortController();
    controller.abort(new DOMException("Cancelled", "AbortError"));

    await expect(search("button", "en", controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(loadPagefind).not.toHaveBeenCalled();
  });
});

describe("createWebMcpTools", () => {
  it("defines the expected tool names and safety annotations", () => {
    const tools = createWebMcpTools(createDependencies());

    expect(tools.map(({ name }) => name)).toEqual(["search_docs", "read_docs", "open_docs"]);
    expect(tools.map(({ annotations }) => annotations)).toEqual([
      { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      { readOnlyHint: false, untrustedContentHint: false, consequentialHint: false },
    ]);
  });

  it("searches the active locale and returns only normalized docs results", async () => {
    const searchDocs = vi.fn(async () => pagefindResponse([
      {
        url: "/zh/docs/components/button/",
        title: "Button",
        excerpt: "  用于   触发操作，并说明激活后会发生什么。  ",
      },
      { url: "/", title: "Home", excerpt: "Homepage" },
    ]));
    const dependencies = createDependencies({
      getLocale: () => "zh",
      searchDocs,
    });

    await expect(execute(tool("search_docs", dependencies), {
      query: "  button  ",
      limit: 2,
    })).resolves.toEqual({
      query: "button",
      locale: "zh",
      total: 2,
      results: [{
        title: "Button",
        url: "https://glui.nocp.space/zh/docs/components/button",
        markdownUrl: "https://glui.nocp.space/zh/docs/components/button.md",
        excerpt: "用于 触发操作，并说明激活后会发生什么。",
      }],
    });
    expect(searchDocs).toHaveBeenCalledWith("button", "zh", expect.any(AbortSignal));
  });

  it("validates search inputs at runtime", async () => {
    const searchTool = tool("search_docs", createDependencies());

    await expect(execute(searchTool, { query: "   " })).rejects.toThrow(
      "query must contain a non-whitespace character",
    );
    await expect(execute(searchTool, { query: "button", limit: 6 })).rejects.toThrow(
      "limit must be an integer between 1 and 5",
    );
    await expect(execute(searchTool, { query: "button", extra: true })).rejects.toThrow(
      "Unexpected input property: extra",
    );
  });

  it("reads Markdown in bounded chunks and returns the next cursor", async () => {
    const markdown = "x".repeat(1250);
    const fetchMarkdown = vi.fn(async () => new Response(markdown));
    const dependencies = createDependencies({ fetchMarkdown });
    const readTool = tool("read_docs", dependencies);
    const signal = new AbortController().signal;

    await expect(execute(readTool, { url: "/docs/components/button" }, signal)).resolves.toEqual({
      url: "https://glui.nocp.space/docs/components/button",
      markdownUrl: "https://glui.nocp.space/docs/components/button.md",
      content: "x".repeat(1200),
      nextCursor: 1200,
    });
    await expect(execute(readTool, {
      url: "/docs/components/button.md",
      cursor: 1200,
    }, signal)).resolves.toEqual({
      url: "https://glui.nocp.space/docs/components/button",
      markdownUrl: "https://glui.nocp.space/docs/components/button.md",
      content: "x".repeat(50),
      nextCursor: null,
    });
    expect(fetchMarkdown).toHaveBeenCalledWith(
      "https://glui.nocp.space/docs/components/button.md",
      signal,
    );
  });

  it("reports read failures and invalid cursors", async () => {
    const failedFetch = createDependencies({
      fetchMarkdown: vi.fn(async () => new Response("Missing", { status: 404 })),
    });

    await expect(execute(tool("read_docs", failedFetch), {
      url: "/docs/components/missing",
    })).rejects.toThrow("HTTP 404");

    await expect(execute(tool("read_docs", createDependencies()), {
      url: "/docs/components/button",
      cursor: 100,
    })).rejects.toThrow("cursor must not exceed the document length");
  });

  it("opens only a normalized docs page through Astro navigation", async () => {
    const navigateTo = vi.fn(async () => undefined);
    const dependencies = createDependencies({ navigateTo });
    const openTool = tool("open_docs", dependencies);

    await expect(execute(openTool, {
      url: "/zh/docs/components/button.md#usage",
    })).resolves.toEqual({
      url: "https://glui.nocp.space/zh/docs/components/button#usage",
    });
    expect(navigateTo).toHaveBeenCalledWith(
      "https://glui.nocp.space/zh/docs/components/button#usage",
    );

    await expect(execute(openTool, { url: "https://example.com/docs" })).rejects.toThrow(
      "url must use the same origin",
    );
    expect(navigateTo).toHaveBeenCalledTimes(1);
  });
});

describe("installWebMcpTools", () => {
  it("does nothing when the browser does not expose WebMCP", async () => {
    await expect(installWebMcpTools({ host: {}, scope: {} })).resolves.toBeUndefined();
  });

  it("registers all tools only once for a shared document scope", async () => {
    const registerTool = vi.fn(async (
      _tool: WebMCP.ModelContextTool,
      _options?: WebMCP.ModelContextRegisterToolOptions,
    ) => undefined);
    const host = {
      modelContext: { registerTool } as unknown as Pick<WebMCP.ModelContext, "registerTool">,
    };
    const scope = {};
    const dependencies = createDependencies();

    await installWebMcpTools({ dependencies, host, scope });
    await installWebMcpTools({ dependencies, host, scope });

    expect(registerTool).toHaveBeenCalledTimes(3);
    expect(registerTool.mock.calls.map(([registeredTool]) => registeredTool.name)).toEqual([
      "search_docs",
      "read_docs",
      "open_docs",
    ]);
    expect(registerTool.mock.calls.every(([, options]) => options?.signal instanceof AbortSignal))
      .toBe(true);
  });

  it("cleans a failed registration so a later attempt can retry", async () => {
    const registerTool = vi.fn(async (
      _tool: WebMCP.ModelContextTool,
      _options?: WebMCP.ModelContextRegisterToolOptions,
    ) => undefined)
      .mockRejectedValueOnce(new Error("Permission denied"))
      .mockResolvedValue(undefined);
    const host = {
      modelContext: { registerTool } as unknown as Pick<WebMCP.ModelContext, "registerTool">,
    };
    const scope = {};
    const dependencies = createDependencies();

    await expect(installWebMcpTools({ dependencies, host, scope })).rejects.toThrow(
      "Permission denied",
    );
    await expect(installWebMcpTools({ dependencies, host, scope })).resolves.toBeUndefined();

    expect(registerTool).toHaveBeenCalledTimes(6);
  });
});
