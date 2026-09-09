/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/markdown/markdown.stories.js
 * packages/gitlab-ui/src/components/base/markdown/markdown_typescale_demo.html
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import GlMarkdown from "./markdown";

function MarkdownTypescaleDemo() {
  return (
    <>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
      <p>
        Paragraph — the quick orange tanuki jumps over the lazy dog. Includes{" "}
        <code>Code span</code>,{" "}
        <span className="idiff addition">addition</span>, and{" "}
        <span className="idiff deletion">deletion</span>.
      </p>
      <p className="sm">
        Small paragraph — the quick orange tanuki jumps over the lazy dog.
      </p>
      <p className="monospace">UI Monospace</p>
      <p className="monospace sm">UI Small Monospace</p>

      <br />

      <ul>
        <li>Unordered list item</li>
        <li>Unordered list item</li>
      </ul>

      <ol>
        <li>Ordered list item</li>
        <li>Ordered list item</li>
      </ol>

      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Header</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cell</td>
            <td>Cell</td>
          </tr>
          <tr>
            <td>Cell</td>
            <td>Cell</td>
          </tr>
        </tbody>
      </table>

      <blockquote>
        <p>Blockquote</p>
        <blockquote>
          <p>Nested blockquote</p>
        </blockquote>
      </blockquote>

      <p>Audio file</p>
      <span className="media-container audio-container">
        <audio aria-label="Audio preview" controls src="file.mp3" />
        <a
          href="file.mp3"
          rel="noopener noreferrer"
          target="_blank"
          title="Download file.mp3">
          file.mp3
        </a>
      </span>

      <p>Code block</p>
      <pre tabIndex={0}>
        <code>
          {`const compact = true;
return <GlMarkdown compact={compact} />;`}
        </code>
      </pre>
    </>
  );
}

const meta = {
  title: "UI/Base/Markdown",
  component: GlMarkdown,
  args: {
    compact: false,
  },
  argTypes: {
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Styles pre-rendered markdown HTML without parsing or sanitizing it. See the [Pajamas Markdown documentation](https://design.gitlab.com/product-foundations/type-markdown/) for usage guidance.",
      },
    },
  },
  render: (args) => (
    <GlMarkdown {...args}>
      <MarkdownTypescaleDemo />
    </GlMarkdown>
  ),
} satisfies Meta<typeof GlMarkdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Documentation: Story = {
  play: async ({ canvas, canvasElement }) => {
    const markdown = canvasElement.querySelector(".gl-markdown");

    await expect(markdown).not.toHaveClass("gl-compact-markdown");
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Heading 1",
    );
    await expect(canvas.getByText("addition")).toHaveClass("idiff", "addition");
    await expect(canvas.getByRole("table")).toBeVisible();
    await expect(canvas.getByLabelText("Audio preview")).toBeVisible();
  },
};

export const Compact: Story = {
  args: {
    compact: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".gl-markdown")).toHaveClass(
      "gl-compact-markdown",
    );
  },
};
