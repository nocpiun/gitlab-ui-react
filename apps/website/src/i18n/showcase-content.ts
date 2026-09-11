import { languageTags, type Locale } from "./config";

export type BillingCycle = "annual" | "monthly";
export type OrderFilter = "all" | OrderStatus;
export type OrderStatus = "completed" | "processing";

type MetricKey = "cpu" | "memory" | "network" | "uptime";

export type ShowcaseContent = {
  basic: {
    button: string;
    buttonNumber: string;
    checkboxLabel: string;
    confirm: string;
    dropdown: string;
    dropdownItems: readonly string[];
    modalBody: string;
    modalTitle: string;
    moreActions: string;
    openModal: string;
    radioLabel: string;
    searchPlaceholder: string;
    sendPlaceholder: string;
    tier: string;
    toggleLabel: string;
  };
  dashboard: {
    averageResponseTime: string;
    breadcrumbLabel: string;
    infrastructure: string;
    metrics: readonly {
      description: string;
      key: MetricKey;
      label: string;
      progress?: number;
      value: string;
    }[];
    overview: string;
    serverOverview: string;
    updated: string;
  };
  login: {
    createAccount: string;
    email: string;
    emailPlaceholder: string;
    forgotPassword: string;
    newHere: string;
    or: string;
    password: string;
    passwordPlaceholder: string;
    hidePassword: string;
    rememberMe: string;
    revealPassword: string;
    signIn: string;
    socialSignIn: string;
  };
  memberProfile: {
    displayName: string;
    handle: string;
    location: string;
    locationLabel: string;
    role: string;
    schedule: string;
    scheduleLabel: string;
    team: string;
    teamLabel: string;
    timeZone: string;
    timeZoneLabel: string;
  };
  orders: {
    alert: string;
    breadcrumbLabel: string;
    caption: string;
    currency: "CNY" | "USD";
    customers: readonly string[];
    empty: string;
    order: string;
    orders: string;
    paginationLabel: string;
    previousPageLabel: string;
    nextPageLabel: string;
    processing: string;
    completed: string;
    firstPageLabel: string;
    lastPageLabel: string;
    pageLabel: string;
    searchLabel: string;
    searchPlaceholder: string;
    statistics: string;
    status: string;
    tabCountLabel: string;
    title: string;
    total: string;
  };
  proPlan: {
    billingCycleLabel: string;
    billingOptions: Record<BillingCycle, {
      billedLabel: string;
      buttonLabel: string;
      price: number;
    }>;
    cancelAnytime: string;
    currency: "CNY" | "USD";
    description: string;
    features: readonly string[];
    featuresTitle: string;
    perMonth: string;
    recommended: string;
    title: string;
    upgrade: string;
  };
  sidebars1: {
    accountNavigationLabel: string;
    adminNavigationLabel: string;
    appearance: string;
    billing: string;
    dashboard: string;
    logs: string;
    monitor: string;
    notifications: string;
    preferences: string;
    security: string;
    settings: string;
    user: string;
    users: string;
  };
  sidebars2: {
    boards: string;
    build: string;
    code: string;
    explore: string;
    groups: string;
    home: string;
    issues: string;
    mergeRequests: string;
    overview: string;
    plan: string;
    projectNavigationLabel: string;
    projects: string;
    repository: string;
    todo: string;
    workspaceNavigationLabel: string;
  };
  skeleton: {
    loadingLabel: string;
  };
};

export const showcaseContent = {
  en: {
    basic: {
      button: "Button",
      buttonNumber: "Button {number}",
      checkboxLabel: "Example checkbox",
      confirm: "Confirm",
      dropdown: "Dropdown",
      dropdownItems: ["Foo", "Bar"],
      modalBody: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      modalTitle: "Hello Pajamas!",
      moreActions: "More actions",
      openModal: "Open Modal",
      radioLabel: "Example radio",
      searchPlaceholder: "Search something...",
      sendPlaceholder: "Send message...",
      tier: "Ultimate",
      toggleLabel: "Example toggle",
    },
    dashboard: {
      averageResponseTime: "Average response time",
      breadcrumbLabel: "Dashboard location",
      infrastructure: "Infrastructure",
      metrics: [
        { description: "Average processor utilization.", key: "cpu", label: "CPU usage", value: "42%" },
        { description: "Memory currently used by services.", key: "memory", label: "Memory usage", value: "12.6 GB" },
        { description: "Transferred over the last 30 days.", key: "network", label: "Network traffic", value: "248 GB" },
        { description: "Availability during this period.", key: "uptime", label: "Uptime", progress: 99.98, value: "99.98%" },
      ],
      overview: "Overview",
      serverOverview: "Server Overview",
      updated: "Updated just now",
    },
    login: {
      createAccount: "Create an account",
      email: "Email address",
      emailPlaceholder: "you@example.com",
      forgotPassword: "Forgot password?",
      newHere: "New here?",
      or: "or",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      hidePassword: "Hide password",
      rememberMe: "Remember me",
      revealPassword: "Reveal password",
      signIn: "Sign in",
      socialSignIn: "Continue with Google",
    },
    memberProfile: {
      displayName: "Norcleeh",
      handle: "@NriotHrreion",
      location: "Mainland China",
      locationLabel: "Location",
      role: "Software Engineering",
      schedule: "On call",
      scheduleLabel: "Schedule",
      team: "Software",
      teamLabel: "Team",
      timeZone: "UTC+8",
      timeZoneLabel: "Time zone",
    },
    orders: {
      alert: "Recent order updates may take a few minutes to appear.",
      breadcrumbLabel: "Dashboard location",
      caption: "Customer orders",
      currency: "USD",
      customers: [
        "Lena Ortiz", "Ethan Reed", "Mina Park", "Noah Williams",
        "Ava Patel", "Leo Martin", "Sofia Rossi", "Oliver Chen",
        "Amara Okafor", "Lucas Silva", "Hana Kim", "Mateo Garcia",
        "Freya Jensen", "Samira Khan", "Jack Thompson", "Chloe Dubois",
      ],
      empty: "No orders found",
      firstPageLabel: "Go to first page",
      lastPageLabel: "Go to last page",
      order: "Order",
      orders: "Orders",
      pageLabel: "Go to page {page}",
      paginationLabel: "Orders pagination",
      previousPageLabel: "Go to previous page",
      nextPageLabel: "Go to next page",
      processing: "Processing",
      completed: "Completed",
      searchLabel: "Search orders",
      searchPlaceholder: "Search orders or customers...",
      statistics: "Statistics",
      status: "Status",
      tabCountLabel: "{count} {status} orders",
      title: "Customer Orders",
      total: "Total",
    },
    proPlan: {
      billingCycleLabel: "Billing cycle",
      billingOptions: {
        annual: {
          billedLabel: "$288 billed annually",
          buttonLabel: "Annual · Save 17%",
          price: 24,
        },
        monthly: {
          billedLabel: "Billed monthly",
          buttonLabel: "Monthly",
          price: 29,
        },
      },
      cancelAnytime: "Cancel anytime. Your current plan stays active until renewal.",
      currency: "USD",
      description: "More intelligence and capacity for your everyday work.",
      features: [
        "Access to advanced AI models",
        "Unlimited projects and chats",
        "Faster responses at peak times",
        "Priority access to new features",
      ],
      featuresTitle: "Everything you need to move faster",
      perMonth: "USD / month",
      recommended: "Recommended",
      title: "AI Pro",
      upgrade: "Upgrade to Pro",
    },
    sidebars1: {
      accountNavigationLabel: "Account navigation",
      adminNavigationLabel: "Administration navigation",
      appearance: "Appearance",
      billing: "Billing",
      dashboard: "Dashboard",
      logs: "Logs",
      monitor: "Monitor",
      notifications: "Notifications",
      preferences: "Preferences",
      security: "Security",
      settings: "Settings",
      user: "Norcleeh",
      users: "Users",
    },
    sidebars2: {
      boards: "Boards",
      build: "Build",
      code: "Code",
      explore: "Explore",
      groups: "Groups",
      home: "Home",
      issues: "Issues",
      mergeRequests: "Merge requests",
      overview: "Overview",
      plan: "Plan",
      projectNavigationLabel: "Project navigation",
      projects: "Projects",
      repository: "Repository",
      todo: "To-do",
      workspaceNavigationLabel: "Workspace navigation",
    },
    skeleton: {
      loadingLabel: "Workspace content is loading",
    },
  },
  zh: {
    basic: {
      button: "按钮",
      buttonNumber: "按钮 {number}",
      checkboxLabel: "示例复选框",
      confirm: "确认",
      dropdown: "下拉菜单",
      dropdownItems: ["选项一", "选项二"],
      modalBody: "Pajamas 为产品界面提供一致、清晰且易于使用的设计基础。",
      modalTitle: "你好，Pajamas！",
      moreActions: "更多操作",
      openModal: "打开弹窗",
      radioLabel: "示例单选框",
      searchPlaceholder: "搜索内容……",
      sendPlaceholder: "发送消息……",
      tier: "超级会员",
      toggleLabel: "示例开关",
    },
    dashboard: {
      averageResponseTime: "平均响应时间",
      breadcrumbLabel: "仪表盘位置",
      infrastructure: "基础设施",
      metrics: [
        { description: "处理器的平均使用率。", key: "cpu", label: "CPU 使用率", value: "42%" },
        { description: "服务当前使用的内存。", key: "memory", label: "内存使用量", value: "12.6 GB" },
        { description: "最近 30 天传输的数据量。", key: "network", label: "网络流量", value: "248 GB" },
        { description: "此时间段内的可用率。", key: "uptime", label: "正常运行时间", progress: 99.98, value: "99.98%" },
      ],
      overview: "概览",
      serverOverview: "服务器概览",
      updated: "刚刚更新",
    },
    login: {
      createAccount: "创建账号",
      email: "邮箱地址",
      emailPlaceholder: "you@example.com",
      forgotPassword: "忘记密码？",
      newHere: "初次使用？",
      or: "或",
      password: "密码",
      passwordPlaceholder: "请输入密码",
      hidePassword: "隐藏密码",
      rememberMe: "记住登录状态",
      revealPassword: "显示密码",
      signIn: "登录",
      socialSignIn: "微信扫码登录",
    },
    memberProfile: {
      displayName: "李华",
      handle: "@LiHua",
      location: "中国大陆",
      locationLabel: "所在地",
      role: "国际化产品经理",
      schedule: "值班中",
      scheduleLabel: "值班安排",
      team: "软件研发",
      teamLabel: "团队",
      timeZone: "UTC+8",
      timeZoneLabel: "时区",
    },
    orders: {
      alert: "最近的订单更新可能需要几分钟才能显示。",
      breadcrumbLabel: "仪表盘位置",
      caption: "客户订单",
      currency: "CNY",
      customers: [
        "李四", "张三", "王五", "李华",
        "陈曦", "赵磊", "周宁", "吴昊",
        "郑欣", "孙悦", "何雨", "林杰",
        "郭琪", "唐宁", "许晨", "蒋雯",
      ],
      empty: "未找到订单",
      firstPageLabel: "转到第一页",
      lastPageLabel: "转到最后一页",
      order: "订单",
      orders: "订单",
      pageLabel: "转到第 {page} 页",
      paginationLabel: "订单分页",
      previousPageLabel: "转到上一页",
      nextPageLabel: "转到下一页",
      processing: "处理中",
      completed: "已完成",
      searchLabel: "搜索订单",
      searchPlaceholder: "搜索订单或客户……",
      statistics: "统计",
      status: "状态",
      tabCountLabel: "{count} 个{status}订单",
      title: "客户订单",
      total: "总计",
    },
    proPlan: {
      billingCycleLabel: "计费周期",
      billingOptions: {
        annual: {
          billedLabel: "每年收取 ¥1,980",
          buttonLabel: "年付 · 节省 17%",
          price: 165,
        },
        monthly: {
          billedLabel: "按月计费",
          buttonLabel: "月付",
          price: 199,
        },
      },
      cancelAnytime: "可随时取消。当前套餐将在续订日期前保持有效。",
      currency: "CNY",
      description: "为日常工作提供更强的智能能力与使用额度。",
      features: [
        "使用高级 AI 模型",
        "不限量的项目与对话",
        "高峰时段响应更快",
        "无广告体验",
      ],
      featuresTitle: "高效工作所需的一切",
      perMonth: "人民币 / 月",
      recommended: "推荐",
      title: "AI 超级会员",
      upgrade: "升级到 超级会员",
    },
    sidebars1: {
      accountNavigationLabel: "账号导航",
      adminNavigationLabel: "管理导航",
      appearance: "外观",
      billing: "账单",
      dashboard: "仪表盘",
      logs: "日志",
      monitor: "监控",
      notifications: "通知",
      preferences: "偏好设置",
      security: "安全",
      settings: "设置",
      user: "Norcleeh",
      users: "用户",
    },
    sidebars2: {
      boards: "议题看板",
      build: "构建",
      code: "代码",
      explore: "探索",
      groups: "群组",
      home: "首页",
      issues: "议题",
      mergeRequests: "合并请求",
      overview: "概览",
      plan: "计划",
      projectNavigationLabel: "项目导航",
      projects: "项目",
      repository: "代码库",
      todo: "待办事项",
      workspaceNavigationLabel: "工作区导航",
    },
    skeleton: {
      loadingLabel: "正在加载工作区内容",
    },
  },
} satisfies Record<Locale, ShowcaseContent>;

export function formatCurrency(
  locale: Locale,
  value: number,
  currency: "CNY" | "USD",
  fractionDigits = 2,
) {
  return new Intl.NumberFormat(languageTags[locale], {
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    style: "currency",
  }).format(value);
}

export function matchesOrderFilter(status: OrderStatus, filter: OrderFilter) {
  return filter === "all" || status === filter;
}
