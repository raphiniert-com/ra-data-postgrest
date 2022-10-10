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

export type PostgRestOperator = typeof postgrestOperators[number];

export const parseFilters = (
    filter: Record<string, any>,
    defaultListOp: PostgRestOperator
) => {
    let result = {};
    Object.keys(filter).forEach(function (key) {
        // key: the name of the object key

        const splitKey = key.split('@');
        const operation: PostgRestOperator =
            splitKey.length == 2
                ? (splitKey[1] as PostgRestOperator)
                : defaultListOp;

        let values: Array<string>;
        if (operation in ['like', 'ilike']) {
            // we split the search term in words
            values = filter[key].trim().split(' ');
        } else {
            values = [filter[key]];
        }

        values.forEach(value => {
            // if operator is intentionally blank, rpc syntax
            let op = operation.includes('like')
                ? `${operation}.*${value}*`
                : operation.length == 0
                ? `${value}`
                : `${operation}.${value}`;

            if (result[splitKey[0]] === undefined) {
                // first operator for the key, we add it to the dict
                result[splitKey[0]] = op;
            } else {
                if (!Array.isArray(result[splitKey[0]])) {
                    // second operator, we transform to an array
                    result[splitKey[0]] = [result[splitKey[0]], op];
                } else {
                    // third and subsequent, we add to array
                    result[splitKey[0]].push(op);
                }
            }
        });
    });

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

export const decodeId = (id: Identifier, primaryKey: PrimaryKey): string[] => {
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

export const dataWithId = (data: any, primaryKey: PrimaryKey) => {
    if (JSON.stringify(primaryKey) === JSON.stringify(['id'])) {
        return data;
    }

    return Object.assign(data, {
        id: encodeId(data, primaryKey),
    });
};

export const isCompoundKey = (primaryKey: PrimaryKey): Boolean => {
    return primaryKey.length > 1;
};

export const getQuery = (
    primaryKey: PrimaryKey,
    ids: Identifier | Array<Identifier>,
    resource: string
): string => {
    if (Array.isArray(ids) && ids.length > 1) {
        // no standardized query with multiple ids possible for rpc endpoints which are api-exposed database functions
        if (resource.startsWith('rpc/')) {
            console.error(
                "PostgREST's rpc endpoints are not intended to be handled as views. Therefore, no query generation for multiple key values implemented!"
            );

            return;
        }

        if (isCompoundKey(primaryKey)) {
            return `or=(
            ${ids.map(id => {
                const primaryKeyParams = decodeId(id, primaryKey);
                return `and(${primaryKey
                    .map((key, i) => `${key}.eq.${primaryKeyParams[i]}`)
                    .join(',')})`;
            })}
          )`;
        } else {
            return new URLSearchParams({
                [primaryKey[0]]: `in.(${ids.join(',')})`,
            }).toString();
        }
    } else {
        // if ids is one Identifier
        const id: Identifier = ids.toString();
        const primaryKeyParams = decodeId(id, primaryKey);

        if (isCompoundKey(primaryKey)) {
            if (resource.startsWith('rpc/'))
                return `${primaryKey
                    .map(
                        (key: string, i: any) => `${key}=${primaryKeyParams[i]}`
                    )
                    .join('&')}`;
            else
                return `and=(${primaryKey
                    .map(
                        (key: string, i: any) =>
                            `${key}.eq.${primaryKeyParams[i]}`
                    )
                    .join(',')})`;
        } else {
            return new URLSearchParams([
                [primaryKey[0], `eq.${id}`],
            ]).toString();
        }
    }
};

export const getKeyData = (primaryKey: PrimaryKey, data: object): object => {
    if (isCompoundKey(primaryKey)) {
        return primaryKey.reduce(
            (keyData, key) => ({
                ...keyData,
                [key]: data[key],
            }),
            {}
        );
    } else {
        return { [primaryKey[0]]: data[primaryKey[0]] };
    }
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

// TODO: create function such as generatePostgRestUrl(), taking filter props,
//       ids etc. and return the generated PostgREST uri
