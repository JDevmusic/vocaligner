import { createMockModelClient } from "./mockModelClient";
import type { ModelClient } from "./modelClient";

export function getModelClient(): ModelClient {
  return createMockModelClient();
}
