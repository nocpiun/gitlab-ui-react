import type { Locale } from "./config";

export type CalloutKind = "caution" | "important" | "note" | "tip" | "warning";

export type SiteMessages = {
  home: {
    browseComponents: string;
    description: string;
    getStarted: string;
    showcaseLabel: string;
    title: string;
  };
  navbar: {
    components: string;
    docs: string;
    home: string;
    languageLabel: string;
    navigationLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    switchToDark: string;
    switchToLight: string;
  };
  footer: {
    affiliation: string;
    externalLinkLabel: string;
    navigationLabel: string;
    tagline: string;
  };
  docs: {
    callouts: Record<CalloutKind, string>;
    codeCopy: {
      copied: string;
      failed: string;
      idle: string;
    };
    example: {
      storybookLinkLabel: string;
      hideSource: string;
      showSource: string;
    };
    navigation: {
      collapse: string;
      collapseNavigation: string;
      color: string;
      components: string;
      designTokens: string;
      documentationLabel: string;
      expand: string;
      expandNavigation: string;
      icons: string;
      installation: string;
      introduction: string;
    };
    tableOfContents: {
      empty: string;
      label: string;
      title: string;
    };
  };
};

export const siteMessages = {
  en: {
    home: {
      browseComponents: "Browse Components",
      description: "GitLab Pajamas UI for React",
      getStarted: "Get Started",
      showcaseLabel: "Interface examples for different products",
      title: "Bringing GitLab's UI to React.",
    },
    navbar: {
      components: "Components",
      docs: "Docs",
      home: "Home",
      languageLabel: "Language: {language}",
      navigationLabel: "Primary navigation",
      searchLabel: "Search documentation",
      searchPlaceholder: "Search documents...",
      switchToDark: "Switch to dark mode",
      switchToLight: "Switch to light mode",
    },
    footer: {
      affiliation: "Portions © GitLab Inc. Unofficial and not affiliated with GitLab Inc.",
      externalLinkLabel: "{name} (external link)",
      navigationLabel: "Footer navigation",
      tagline: "GitLab Pajamas components built for React.",
    },
    docs: {
      callouts: {
        caution: "Caution",
        important: "Important",
        note: "Note",
        tip: "Tip",
        warning: "Warning",
      },
      codeCopy: {
        copied: "Code copied",
        failed: "Copy failed",
        idle: "Copy code",
      },
      example: {
        storybookLinkLabel: "Storybook (external link)",
        hideSource: "Hide source code for {title}",
        showSource: "Show source code for {title}",
      },
      navigation: {
        collapse: "Collapse",
        collapseNavigation: "Collapse navigation",
        color: "Color",
        components: "Components",
        designTokens: "Design tokens",
        documentationLabel: "Documentation navigation",
        expand: "Expand",
        expandNavigation: "Expand navigation",
        icons: "Icons",
        installation: "Installation",
        introduction: "Introduction",
      },
      tableOfContents: {
        empty: "No sections on this page.",
        label: "On this page",
        title: "On this page",
      },
    },
  },
  zh: {
    home: {
      browseComponents: "浏览组件",
      description: "面向 React 的 GitLab Pajamas UI",
      getStarted: "开始使用",
      showcaseLabel: "不同产品的界面示例",
      title: "GitLab UI，但是 React。",
    },
    navbar: {
      components: "组件",
      docs: "文档",
      home: "首页",
      languageLabel: "语言：{language}",
      navigationLabel: "主导航",
      searchLabel: "搜索文档",
      searchPlaceholder: "搜索文档……",
      switchToDark: "切换到深色模式",
      switchToLight: "切换到浅色模式",
    },
    footer: {
      affiliation: "部分内容 © GitLab Inc.。本项目为非官方项目，与 GitLab Inc. 无关联。",
      externalLinkLabel: "{name}（外部链接）",
      navigationLabel: "页脚导航",
      tagline: "为 React 构建的 GitLab Pajamas 组件。",
    },
    docs: {
      callouts: {
        caution: "谨慎操作",
        important: "重要",
        note: "注意",
        tip: "提示",
        warning: "警告",
      },
      codeCopy: {
        copied: "代码已复制",
        failed: "复制失败",
        idle: "复制代码",
      },
      example: {
        storybookLinkLabel: "Storybook（外部链接）",
        hideSource: "隐藏“{title}”的源代码",
        showSource: "显示“{title}”的源代码",
      },
      navigation: {
        collapse: "收起",
        collapseNavigation: "收起导航",
        color: "颜色",
        components: "组件",
        designTokens: "设计令牌",
        documentationLabel: "文档导航",
        expand: "展开",
        expandNavigation: "展开导航",
        icons: "图标",
        installation: "安装",
        introduction: "介绍",
      },
      tableOfContents: {
        empty: "此页面没有章节。",
        label: "On this page",
        title: "On this page",
      },
    },
  },
} satisfies Record<Locale, SiteMessages>;
