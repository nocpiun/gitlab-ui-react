import type { Locale } from "./i18n/config";

const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 5;
const MAX_QUERY_LENGTH = 200;
const MAX_URL_LENGTH = 2048;
const SEARCH_EXCERPT_LENGTH = 120;
const DOCS_CHUNK_LENGTH = 1200;
const DOCS_PATH_PATTERN = /^\/(?:zh\/)?docs(?:\/[a-z0-9][a-z0-9-]*)*$/;
const REGISTRATION_KEY = "__gitlabUiReactWebMcpRegistration";

export type PagefindResultData = {
  meta?: Record<string, unknown>;
  plain_excerpt?: string;
  url: string;
};

export type PagefindSearchResponse = {
  results: Array<{
    data(): Promise<PagefindResultData>;
  }>;
};

export type PagefindModule = {
  destroy(): Promise<void> | void;
  init(): Promise<void> | void;
  search(query: string): Promise<PagefindSearchResponse>;
};

export type WebMcpDependencies = {
  fetchMarkdown(url: string, signal: AbortSignal): Promise<Response>;
  getCurrentUrl(): URL;
  getLocale(): Locale;
  navigateTo(url: string): Promise<void>;
  searchDocs(query: string, locale: Locale, signal: AbortSignal): Promise<PagefindSearchResponse>;
};

type RegistrationState = {
  controller: AbortController;
  ready: Promise<void>;
};

type RegistrationScope = {
  [REGISTRATION_KEY]?: RegistrationState;
};

type ModelContextHost = {
  modelContext?: Pick<WebMCP.ModelContext, "registerTool">;
};

type InstallWebMcpOptions = {
  dependencies?: WebMcpDependencies;
  host?: ModelContextHost;
  scope?: RegistrationScope;
};

export function normalizeDocsUrl(rawUrl: string, currentUrl: URL) {
  if(rawUrl.length === 0 || rawUrl.length > MAX_URL_LENGTH) {
    throw new TypeError(`url must contain between 1 and ${MAX_URL_LENGTH} characters.`);
  }

  let candidate: URL;

  try {
    candidate = new URL(rawUrl, currentUrl);
  } catch {
    throw new TypeError("url must be a valid absolute or site-relative URL.");
  }

  if(candidate.origin !== currentUrl.origin) {
    throw new TypeError("url must use the same origin as this website.");
  }

  let pathname = candidate.pathname;

  try {
    if(decodeURIComponent(pathname) !== pathname) {
      throw new TypeError("url must not contain an encoded documentation path.");
    }
  } catch(error) {
    if(error instanceof TypeError) throw error;
    throw new TypeError("url contains an invalid encoded path.");
  }

  if(pathname.endsWith("/") && pathname !== "/") pathname = pathname.slice(0, -1);
  if(pathname.endsWith(".md")) pathname = pathname.slice(0, -".md".length);

  if(!DOCS_PATH_PATTERN.test(pathname)) {
    throw new TypeError("url must point to an English or Chinese documentation page.");
  }

  const pageUrl = new URL(pathname, currentUrl.origin);
  pageUrl.hash = candidate.hash;

  return {
    markdownUrl: new URL(`${pathname}.md`, currentUrl.origin),
    pageUrl,
  };
}

export function createPagefindSearch(loadPagefind: () => Promise<PagefindModule>) {
  let activeLocale: Locale | undefined;
  let operationQueue = Promise.resolve();

  return async (query: string, locale: Locale, signal: AbortSignal) => {
    const operation = operationQueue.then(async () => {
      throwIfAborted(signal);
      const pagefind = await loadPagefind();

      if(activeLocale !== locale) {
        if(activeLocale !== undefined) await pagefind.destroy();
        throwIfAborted(signal);
        await pagefind.init();
        activeLocale = locale;
      }

      throwIfAborted(signal);
      const response = await pagefind.search(query);
      throwIfAborted(signal);
      return response;
    });

    operationQueue = operation.then(() => undefined, () => undefined);
    return operation;
  };
}

export function createWebMcpTools(dependencies: WebMcpDependencies) {
  const searchDocs: WebMCP.ModelContextTool = {
    name: "search_docs",
    title: "Search GitLab UI React docs",
    description:
      "Search the GitLab UI React documentation in the language currently shown on the website. Returns matching pages and plain-text excerpts.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          minLength: 1,
          maxLength: MAX_QUERY_LENGTH,
          description: "Words describing the GitLab UI React topic or component to find.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_SEARCH_LIMIT,
          default: DEFAULT_SEARCH_LIMIT,
          description: "Maximum number of matching documentation pages to return.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: false,
      consequentialHint: false,
    },
    async execute(input, { signal }) {
      assertAllowedProperties(input, ["query", "limit"]);
      const query = requiredString(input.query, "query", MAX_QUERY_LENGTH).trim();
      if(query.length === 0) throw new TypeError("query must contain a non-whitespace character.");
      const limit = optionalInteger(input.limit, "limit", DEFAULT_SEARCH_LIMIT, 1, MAX_SEARCH_LIMIT);
      const locale = dependencies.getLocale();

      let search: PagefindSearchResponse;

      try {
        search = await dependencies.searchDocs(query, locale, signal);
      } catch(error) {
        throwIfAborted(signal);
        throw new Error(`search_docs could not load the documentation index: ${errorMessage(error)}`);
      }

      const results = [];

      for(const result of search.results) {
        if(results.length >= limit) break;
        throwIfAborted(signal);

        const data = await result.data();
        let urls: ReturnType<typeof normalizeDocsUrl>;

        try {
          urls = normalizeDocsUrl(data.url, dependencies.getCurrentUrl());
        } catch {
          continue;
        }

        const title = typeof data.meta?.title === "string"
          ? data.meta.title
          : urls.pageUrl.pathname.split("/").at(-1) ?? "Documentation";

        results.push({
          title,
          url: urls.pageUrl.href,
          markdownUrl: urls.markdownUrl.href,
          excerpt: truncateText(data.plain_excerpt ?? "", SEARCH_EXCERPT_LENGTH),
        });
      }

      return {
        query,
        locale,
        total: search.results.length,
        results,
      };
    },
  };

  const readDocs: WebMCP.ModelContextTool = {
    name: "read_docs",
    title: "Read GitLab UI React docs",
    description:
      "Read a GitLab UI React documentation page as Markdown. Use a URL from search_docs and pass nextCursor back as cursor to continue reading.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          minLength: 1,
          maxLength: MAX_URL_LENGTH,
          description: "An English or Chinese documentation URL from search_docs.",
        },
        cursor: {
          type: "integer",
          minimum: 0,
          default: 0,
          description: "The nextCursor value returned by the previous read_docs call.",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: false,
      consequentialHint: false,
    },
    async execute(input, { signal }) {
      assertAllowedProperties(input, ["url", "cursor"]);
      const url = requiredString(input.url, "url", MAX_URL_LENGTH).trim();
      const cursor = optionalInteger(input.cursor, "cursor", 0, 0, Number.MAX_SAFE_INTEGER);
      const { markdownUrl, pageUrl } = normalizeDocsUrl(url, dependencies.getCurrentUrl());
      throwIfAborted(signal);

      let response: Response;

      try {
        response = await dependencies.fetchMarkdown(markdownUrl.href, signal);
      } catch(error) {
        throwIfAborted(signal);
        throw new Error(`read_docs could not load the Markdown page: ${errorMessage(error)}`);
      }

      if(!response.ok) {
        throw new Error(`read_docs could not load the Markdown page: HTTP ${response.status}.`);
      }

      const markdown = await response.text();
      throwIfAborted(signal);

      if(cursor > markdown.length) {
        throw new TypeError(`cursor must not exceed the document length of ${markdown.length}.`);
      }

      const nextCursor = Math.min(cursor + DOCS_CHUNK_LENGTH, markdown.length);

      return {
        url: pageUrl.href,
        markdownUrl: markdownUrl.href,
        content: markdown.slice(cursor, nextCursor),
        nextCursor: nextCursor < markdown.length ? nextCursor : null,
      };
    },
  };

  const openDocs: WebMCP.ModelContextTool = {
    name: "open_docs",
    title: "Open GitLab UI React docs",
    description:
      "Open a GitLab UI React documentation page in the current browser tab so the selected page is visible to the user.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          minLength: 1,
          maxLength: MAX_URL_LENGTH,
          description: "An English or Chinese documentation URL from search_docs.",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      untrustedContentHint: false,
      consequentialHint: false,
    },
    async execute(input, { signal }) {
      assertAllowedProperties(input, ["url"]);
      const url = requiredString(input.url, "url", MAX_URL_LENGTH).trim();
      const { pageUrl } = normalizeDocsUrl(url, dependencies.getCurrentUrl());
      throwIfAborted(signal);
      await dependencies.navigateTo(pageUrl.href);
      throwIfAborted(signal);

      return { url: pageUrl.href };
    },
  };

  return [searchDocs, readDocs, openDocs] as const;
}

export async function registerWebMcpTools(
  modelContext: Pick<WebMCP.ModelContext, "registerTool">,
  dependencies: WebMcpDependencies,
  signal: AbortSignal,
) {
  await Promise.all(
    createWebMcpTools(dependencies).map((tool) => modelContext.registerTool(tool, { signal })),
  );
}

export async function installWebMcpTools(options: InstallWebMcpOptions = {}) {
  const host = options.host ?? document;
  const modelContext = host.modelContext;
  if(modelContext === undefined) return;

  const scope = options.scope ?? (window as unknown as RegistrationScope);
  const existingRegistration = scope[REGISTRATION_KEY];
  if(existingRegistration !== undefined) return existingRegistration.ready;

  const controller = new AbortController();
  const dependencies = options.dependencies ?? createBrowserDependencies();
  const ready = registerWebMcpTools(modelContext, dependencies, controller.signal).catch((error) => {
    controller.abort();
    if(scope[REGISTRATION_KEY]?.controller === controller) delete scope[REGISTRATION_KEY];
    throw error;
  });

  scope[REGISTRATION_KEY] = { controller, ready };
  return ready;
}

export function disposeWebMcpTools(scope = window as unknown as RegistrationScope) {
  const registration = scope[REGISTRATION_KEY];
  if(registration === undefined) return;

  registration.controller.abort();
  delete scope[REGISTRATION_KEY];
}

function createBrowserDependencies(): WebMcpDependencies {
  let pagefindPromise: Promise<PagefindModule> | undefined;
  const searchDocs = createPagefindSearch(async () => {
    pagefindPromise ??= import(
      /* @vite-ignore */ new URL(`${import.meta.env.BASE_URL}pagefind/pagefind.js`, document.baseURI).href
    ).catch((error) => {
      pagefindPromise = undefined;
      throw error;
    }) as Promise<PagefindModule>;

    return pagefindPromise;
  });

  return {
    fetchMarkdown: (url, signal) => fetch(url, {
      headers: { Accept: "text/markdown" },
      signal,
    }),
    getCurrentUrl: () => new URL(window.location.href),
    getLocale: () => document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en",
    navigateTo: async (url) => {
      const { navigate } = await import("astro:transitions/client");
      await navigate(url);
    },
    searchDocs,
  };
}

function assertAllowedProperties(input: Record<string, unknown>, allowed: readonly string[]) {
  const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
  if(unexpected !== undefined) throw new TypeError(`Unexpected input property: ${unexpected}.`);
}

function requiredString(value: unknown, name: string, maxLength: number) {
  if(typeof value !== "string") throw new TypeError(`${name} must be a string.`);
  if(value.length === 0 || value.length > maxLength) {
    throw new TypeError(`${name} must contain between 1 and ${maxLength} characters.`);
  }
  return value;
}

function optionalInteger(
  value: unknown,
  name: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
) {
  if(value === undefined) return defaultValue;
  if(!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new TypeError(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value as number;
}

function truncateText(value: string, maximumLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if(normalized.length <= maximumLength) return normalized;
  return `${normalized.slice(0, maximumLength - 1).trimEnd()}…`;
}

function throwIfAborted(signal: AbortSignal) {
  if(!signal.aborted) return;
  throw signal.reason ?? new DOMException("The WebMCP tool execution was cancelled.", "AbortError");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

if(import.meta.hot) import.meta.hot.dispose(() => disposeWebMcpTools());
