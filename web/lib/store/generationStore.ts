import type { VocalChainResponse } from "../schema/vocalChain";

const generations = new Map<string, VocalChainResponse>();

export function saveGeneration(response: VocalChainResponse): void {
  generations.set(response.id, response);
}

export function getGenerationById(id: string): VocalChainResponse | undefined {
  return generations.get(id);
}
