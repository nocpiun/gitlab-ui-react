import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  assertPublishableVersion,
  publishArguments,
  supportsTrustedPublishing,
  validateInternalDependencies,
  validatePackFileList,
  withHiddenPrereleaseState,
} from "./publish.mts";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for(const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("npm publishing", () => {
  it("requires an npm version with OIDC trusted publishing support", () => {
    expect(supportsTrustedPublishing("11.5.0")).toBe(false);
    expect(supportsTrustedPublishing("11.5.1")).toBe(true);
    expect(supportsTrustedPublishing("11.19.0")).toBe(true);
    expect(supportsTrustedPublishing("12.0.0")).toBe(true);
  });

  it("publishes prereleases directly to latest", () => {
    expect(publishArguments(false)).toEqual(["exec", "changeset", "publish"]);
    expect(publishArguments(true)).toEqual([
      "exec",
      "changeset",
      "publish",
      "--tag",
      "latest",
    ]);
  });

  it("never publishes the internal first-release baseline", () => {
    expect(() => assertPublishableVersion("0.0.0")).toThrow("internal 0.0.0");
    expect(() => assertPublishableVersion("0.1.0")).not.toThrow();
  });

  it("requires fixed-package dependencies to use the workspace protocol", () => {
    expect(() => {
      validateInternalDependencies(
        {
          name: "@gitlab-ui-react/styles",
          dependencies: { "@gitlab-ui-react/tokens": "workspace:^" },
        },
        "0.2.0",
      );
    }).not.toThrow();
    expect(() => {
      validateInternalDependencies(
        {
          name: "@gitlab-ui-react/styles",
          dependencies: { "@gitlab-ui-react/tokens": "^0.1.0" },
        },
        "0.2.0",
      );
    }).toThrow("workspace:^");
  });

  it("temporarily hides and always restores prerelease state", () => {
    const root = mkdtempSync(join(tmpdir(), "gitlab-ui-publish-"));
    temporaryDirectories.push(root);
    mkdirSync(join(root, ".changeset"));
    const preStatePath = join(root, ".changeset", "pre.json");
    writeFileSync(preStatePath, "{\"mode\":\"pre\",\"tag\":\"alpha\"}\n");

    expect(() => {
      withHiddenPrereleaseState(root, () => {
        expect(existsSync(preStatePath)).toBe(false);
        throw new Error("publish failed");
      });
    }).toThrow("publish failed");
    expect(readFileSync(preStatePath, "utf8")).toContain("\"alpha\"");
  });

  it("rejects source files and verifies required package artifacts", () => {
    expect(() => {
      validatePackFileList("@gitlab-ui-react/tokens", [
        "package.json",
        "dist/css/tokens.css",
      ]);
    }).not.toThrow();
    expect(() => {
      validatePackFileList("@gitlab-ui-react/tokens", [
        "package.json",
        "dist/css/tokens.css",
        "src/color_mode.js",
      ]);
    }).toThrow("unexpected files");
    expect(() => {
      validatePackFileList("gitlab-ui-react", [
        "package.json",
        "dist/button/index.js",
        "dist/button/index.cjs",
        "dist/base/button/index.d.ts",
        "dist/base/button/button.test.d.ts",
      ]);
    }).toThrow("test or story artifacts");
    expect(() => {
      validatePackFileList("gitlab-ui-react", [
        "package.json",
        "dist/button/index.js",
        "dist/button/index.cjs",
        "dist/base/button/index.d.ts",
      ]);
    }).not.toThrow();
  });
});
