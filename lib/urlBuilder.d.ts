import { Identifier } from 'ra-core';
/**
 * List of all possible operators in PostgRest
 * (https://postgrest.org/en/stable/api.html#operators)
 */
declare const postgrestOperators: readonly ["eq", "gt", "gte", "lt", "lte", "neq", "like", "ilike", "match", "imatch", "in", "is", "fts", "plfts", "phfts", "wfts", "cs", "cd", "ov", "sl", "sr", "nxr", "nxl", "adj", "not", "or", "and"];
type ParsedFiltersResult = {
    filter: any;
    select: any;
};
export type PostgRestOperator = (typeof postgrestOperators)[number];
export declare const parseFilters: (params: any, defaultListOp: PostgRestOperator) => Partial<ParsedFiltersResult>;
export type PrimaryKey = Array<string>;
export declare const getPrimaryKey: (resource: string, primaryKeys: Map<string, PrimaryKey>) => PrimaryKey;
export declare const decodeId: (id: Identifier, primaryKey: PrimaryKey) => string[] | number[];
export declare const encodeId: (data: any, primaryKey: PrimaryKey) => Identifier;
export declare const removePrimaryKey: (data: any, primaryKey: PrimaryKey) => any;
export declare const dataWithVirtualId: (data: any, primaryKey: PrimaryKey) => any;
export declare const dataWithoutVirtualId: (data: any, primaryKey: PrimaryKey) => any;
export declare const getQuery: (primaryKey: PrimaryKey, ids: Identifier | Array<Identifier> | undefined, resource: string, meta?: any) => any;
export declare const getOrderBy: (field: string, order: string, primaryKey: PrimaryKey) => string;
export {};
