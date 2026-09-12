declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.svg?raw" {
  const content: string;
  export default content;
}
