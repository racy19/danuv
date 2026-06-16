/**
 * Checks whether two sets contain exactly the same values.
 */
export const areSetsEqual = <T>(a: Set<T>, b: Set<T>): boolean => {
	return a.size === b.size && [...a].every((value) => b.has(value));
};