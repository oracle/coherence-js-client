

export interface Filter<T> {

    and(other: Filter<any>): Filter<any>;

    or(other: Filter<any>): Filter<any>;

}
