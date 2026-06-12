// Pure list rule for per-user recent searches: newest first, case-insensitively
// de-duplicated, capped. Kept separate from the Redis I/O so it can be unit-tested.
export const mergeRecent = (existing: string[], query: string, max: number): string[] => {
    const q = query.trim();
    return [q, ...existing.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, max);
};
