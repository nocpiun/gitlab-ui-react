import { cx, type CxOptions } from "class-variance-authority";

export type ClassValue = CxOptions[number];

/** Combines class name values while omitting falsey entries. */
export const cn = (...inputs: CxOptions): string => cx(...inputs);
