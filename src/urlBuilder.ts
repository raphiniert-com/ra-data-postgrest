import { Identifier } from 'ra-core';

/**
 * Interface to clearly seperate the operator like < oder >
 * from the name and the value of the filter
 */
interface PostgRestFilter {
    name: string;
    operator?: PostgRestOperator;
    value: string;
}

/**
 * List of all possible operators in PostgRest
 * (https://postgrest.org/en/stable/api.html#operators)
 */
const postgrestOperators = [
    'eq',
    'gt',
    'gte',
    'lt',
    'lte',
    'neq',
    'like',
    'ilike',
    'match',
    'imatch',
    'in',
    'is',
    'fts',
    'plfts',
    'phfts',
    'wfts',
    'cs',
    'cd',
    'ov',
    'sl',
    'sr',
    'nxr',
    'nxl',
    'adj',
    'not',
    'or',
    'and',
] as const;

type ParsedFiltersResult = {
    filter: any;
    select: any;
};

const isObject = obj =>
    typeof obj === 'object' && !Array.isArray(obj) && obj !== null;

const resolveKeys = (filter: any, keys: Array<any>) => {
    let result = filter[keys[0]];
    for (let i = 1; i < keys.length; ++i) {
        result = result[keys[i]];
    }

    return result;
};

export type PostgRestOperator = (typeof postgrestOperators)[number];

export const parseFilters = (
    params: any,
    defaultListOp: PostgRestOperator
): Partial<ParsedFiltersResult> => {
    const { filter, meta = {} } = params;

    let result: Partial<ParsedFiltersResult> = {};
    result.filter = {};
    Object.keys(filter).forEach(function (key) {
        // key: the name of the object key

        let keyArray = [key];
        let values: Array<string>;

        // in case of a nested object selection in a text field
        // RA returns object{ object } structure which is resolved here
        // see issue https://github.com/raphiniert-com/ra-data-postgrest/issues/58
        if (key.split('@')[0] !== '' && isObject(filter[key])) {
            let innerVal = filter[key];

            do {
                const inner = resolveKeys(filter, keyArray);
                const [innerKey] = Object.keys(inner);

                keyArray.push(innerKey);
                innerVal = inner[innerKey];
            } while (isObject(innerVal));

            key = keyArray.join('.');
            values = [innerVal];
        } else {
            values = [filter[key]];
        }

        const splitKey = key.split('@');
        const operation: PostgRestOperator =
            splitKey.length == 2
                ? (splitKey[1] as PostgRestOperator)
                : defaultListOp;

        if (['like', 'ilike'].includes(operation)) {
            // we split the search term in words
            values = resolveKeys(filter, keyArray).trim().split(/\s+/);
        }
        // CASE: Logical operator
        else if (['or', 'and'].includes(operation)) {
            // we extract each value entries and make it dot separated string.
            const { filter: subFilter } = parseFilters(
                { filter: resolveKeys(filter, keyArray) },
                defaultListOp
            );

            // something like { "age@lt": 18 } and { "age@gt": 21 }
            const filterExpressions: string[] = [];
            Object.entries(subFilter).forEach(([op, val]) => {
                if (Array.isArray(val))
                    filterExpressions.push(...val.map(v => [op, v].join('.')));
                else filterExpressions.push([op, val].join('.'));
            });

            // finally we flatten all as single string and enclose with bracket.
            values = [`(${filterExpressions.join(',')})`];
        }

        values.forEach(value => {
            let op: string = (() => {
                // if operator is intentionally blank, rpc syntax
                if (operation.length === 0) return `${value}`;

                if (operation.includes('like'))
                    return `${operation}.*${value}*`;
                if (['and', 'or'].includes(operation)) return `${value}`;
                if (['cs', 'cd'].includes(operation))
                    return `${operation}.{${value}}`;
                return `${operation}.${value}`;
            })();

            // If resulting filter doesn't contain the fieldname, then add it.
            if (result.filter[splitKey[0]] === undefined) {
                // first operator for the key,
                if (['and', 'or'].includes(operation)) {
                    result.filter[operation] = op;
                } else {
                    // we add it to the dict
                    result.filter[splitKey[0]] = op;
                }
            } else {
                if (!Array.isArray(result[splitKey[0]])) {
                    // second operator, we transform to an array
                    result.filter[splitKey[0]] = [
                        result.filter[splitKey[0]],
                        op,
                    ];
                } else {
                    // third and subsequent, we add to array
                    result.filter[splitKey[0]].push(op);
                }
            }
        });
    });

    if (meta?.columns) {
        result.select = Array.isArray(meta.columns)
            ? meta.columns.join(',')
            : meta.columns;
    }

    return result;
};

// compound keys capability
export type PrimaryKey = Array<string>;

export const getPrimaryKey = (
    resource: string,
    primaryKeys: Map<string, PrimaryKey>
) => {
    return primaryKeys.get(resource) || ['id'];
};

export const decodeId = (
    id: Identifier,
    primaryKey: PrimaryKey
): string[] | number[] => {
    if (isCompoundKey(primaryKey)) {
        return JSON.parse(id.toString());
    } else {
        return [id.toString()];
    }
};

export const encodeId = (data: any, primaryKey: PrimaryKey): Identifier => {
    if (isCompoundKey(primaryKey)) {
        return JSON.stringify(primaryKey.map(key => data[key]));
    } else {
        return data[primaryKey[0]];
    }
};

export const removePrimaryKey = (data: any, primaryKey: PrimaryKey) => {
    const newData = { ...data };
    primaryKey.forEach(key => {
        delete newData[key];
    });
    return newData;
};

export const dataWithVirtualId = (data: any, primaryKey: PrimaryKey) => {
    if (primaryKey.length === 1 && primaryKey[0] === 'id') {
        return data;
    }

    return Object.assign(data, {
        id: encodeId(data, primaryKey),
    });
};

export const dataWithoutVirtualId = (data: any, primaryKey: PrimaryKey) => {
    if (primaryKey.length === 1 && primaryKey[0] === 'id') {
        return data;
    }

    const { id, ...dataWithoutId } = data;
    return dataWithoutId;
};

const isCompoundKey = (primaryKey: PrimaryKey): Boolean => {
    return primaryKey.length > 1;
};

export const getQuery = (
    primaryKey: PrimaryKey,
    ids: Identifier | Array<Identifier> | undefined,
    resource: string,
    meta: any = null
): any => {
    let result: any = {};
    if (Array.isArray(ids) && ids.length > 1) {
        // no standardized query with multiple ids possible for rpc endpoints which are api-exposed database functions
        if (resource.startsWith('rpc/')) {
            console.error(
                "PostgREST's rpc endpoints are not intended to be handled as views. Therefore, no query generation for multiple key values implemented!"
            );

            return;
        }

        if (isCompoundKey(primaryKey)) {
            result = {
                or: `(${ids.map(id => {
                    const primaryKeyParams = decodeId(id, primaryKey);
                    return `and(${primaryKey
                        .map((key, i) => `${key}.eq.${primaryKeyParams[i]}`)
                        .join(',')})`;
                })})`,
            };
        } else {
            result = {
                [primaryKey[0]]: `in.(${ids.join(',')})`,
            };
        }
    } else if (ids) {
        // if ids is one Identifier
        const id: Identifier = ids.toString();
        const primaryKeyParams = decodeId(id, primaryKey);

        if (isCompoundKey(primaryKey)) {
            if (resource.startsWith('rpc/')) {
                result = {};
                primaryKey.map(
                    (key: string, i: any) =>
                        (result[key] = `${primaryKeyParams[i]}`)
                );
            } else {
                result = {
                    and: `(${primaryKey.map(
                        (key: string, i: any) =>
                            `${key}.eq.${primaryKeyParams[i]}`
                    )})`,
                };
            }
        } else {
            result = {
                [primaryKey[0]]: `eq.${id}`,
            };
        }
    }

    if (meta && meta.columns) {
        result.select = Array.isArray(meta.columns)
            ? meta.columns.join(',')
            : meta.columns;
    }

    return result;
};

export const getOrderBy = (
    field: string,
    order: string,
    primaryKey: PrimaryKey
) => {
    if (field == 'id') {
        return primaryKey.map(key => `${key}.${order.toLowerCase()}`).join(',');
    } else {
        return `${field}.${order.toLowerCase()}`;
    }
};
