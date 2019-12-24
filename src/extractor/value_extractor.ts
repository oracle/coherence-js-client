
enum Target { VALUE = 0, KEY = 1 };

/**
 * ValueExtractor is used to both extract values (for example, for sorting
 * or filtering) from an object, and to provide an identity for that extraction.
 */
export interface ValueExtractor<T, E> {

    getTarget(): Target;

}