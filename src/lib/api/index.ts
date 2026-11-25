import { httpApi } from "./http";
import { mockApi } from "./mock";
import type { Api } from "./client";

export * from "./client";
export { httpApi } from "./http";
export { mockApi } from "./mock";

/**
 * True when extraction is in demo mode (NEXT_PUBLIC_DEMO_EXTRACTION !== "false").
 */
export const DEMO_EXTRACTION = process.env.NEXT_PUBLIC_DEMO_EXTRACTION !== "false";

/**
 * Active API client: uses real HTTP Route Handlers by default, or mockApi if NEXT_PUBLIC_USE_MOCK === "true".
 */
export const api: Api = process.env.NEXT_PUBLIC_USE_MOCK === "true" ? mockApi : httpApi;
