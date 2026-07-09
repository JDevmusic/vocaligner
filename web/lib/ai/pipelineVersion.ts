// Bump when the pipeline's *structure* changes — stages added/removed/reordered,
// or a stage's schema shape changes. Distinct from PROMPT_VERSION, which bumps on
// wording-only changes to a prompt. Both are recorded per response so historical
// results can be grouped by exactly which version of the system produced them.
export const PIPELINE_VERSION = "1";
