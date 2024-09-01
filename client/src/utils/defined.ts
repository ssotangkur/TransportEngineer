export const defined = <T>(x: T | undefined | null): x is T => x !== undefined && x !== null
