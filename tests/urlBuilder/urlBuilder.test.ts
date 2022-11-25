import {
    parseFilters,
    getPrimaryKey,
    decodeId,
    encodeId,
    dataWithId,
    isCompoundKey,
    getQuery,
    getKeyData,
    getOrderBy,
} from '../../src/urlBuilder';
import {
    SINGLE_CONTACT,
    SINGLE_LICENSE,
    SINGLE_TODO,
    primaryKeyCompound,
    primaryKeySingle,
    resourcePimaryKeys,
} from '../fixtures';
import { qs } from './helper';

describe('parseFilters', () => {
    it('should parse filters', () => {
        expect(
            parseFilters(
                {
                    q1: 'foo',
                    'q2@ilike': 'bar',
                    'q3@like': 'baz qux',
                    'q4@gt': 'c',
                },
                'eq'
            )
        ).toEqual({
            q1: 'eq.foo',
            q2: 'ilike.*bar*',
            q3: ['like.*baz*', 'like.*qux*'],
            q4: 'gt.c',
        });
    });
});

describe('getPrimaryKey', () => {
    it('should return the special primary for any resource in the resourcePimaryKeys map', () => {
        expect(getPrimaryKey('contacts', resourcePimaryKeys)).toEqual(
            primaryKeyCompound
        );
        expect(getPrimaryKey('licenses', resourcePimaryKeys)).toEqual([
            'license_id',
        ]);
    });
    it("should return the regular primary ['id'] for any other resource", () => {
        expect(getPrimaryKey('todos', resourcePimaryKeys)).toEqual(
            primaryKeySingle
        );
    });
});

describe('decodeId', () => {
    it('should decode from the encoded id the original id', () => {
        expect(decodeId(1, primaryKeySingle)).toEqual(['1']);
        expect(decodeId(1, ['license_id'])).toEqual(['1']);
        expect(decodeId('[1,"X"]', primaryKeyCompound)).toEqual([1, 'X']);
    });
});

describe('encodeId', () => {
    it('should encode from the data the id value itself', () => {
        expect(encodeId(SINGLE_TODO, primaryKeySingle)).toEqual(SINGLE_TODO.id);
        expect(encodeId(SINGLE_LICENSE, ['license_id'])).toEqual(
            SINGLE_LICENSE.license_id
        );
    });
    it('should encode from the data the ids as a json stringified array of the id values', () => {
        expect(encodeId(SINGLE_CONTACT, primaryKeyCompound)).toEqual('[1,"X"]');
    });
});

describe('dataWithId', () => {
    it('should return the data as-is if the primary key is the default one', () => {
        expect(dataWithId(SINGLE_TODO, primaryKeySingle)).toEqual(SINGLE_TODO);
    });
    it('should return the data with the id field added if the primary key is a compound', () => {
        expect(dataWithId(SINGLE_CONTACT, primaryKeyCompound)).toEqual({
            ...SINGLE_CONTACT,
            id: '[1,"X"]',
        });
    });
});

describe('isCompoundKey', () => {
    it('should return false if the primaryKey consists of a single column', () => {
        expect(isCompoundKey(primaryKeySingle)).toBe(false);
    });
    it('should return true if the primaryKey consists of multiple columns', () => {
        expect(isCompoundKey(primaryKeyCompound)).toBe(true);
    });
});

describe('getQuery', () => {
    // Testing all combinations:
    // - non-rpc vs rpc resource x
    // - single vs compound key x
    // - single vs multiple ids
    it('should return the query for a single id of normal resource', () => {
        const resource = 'todos';
        const id = 2;
        const query = new URLSearchParams(
            getQuery(primaryKeySingle, id, resource)
        ).toString();

        expect(query).toEqual(qs({ id: 'eq.2' }));
    });

    it('should return the query for multiple ids of normal resource', () => {
        const resource = 'todos';
        const ids = [1, 2, 3];
        const query = new URLSearchParams(
            getQuery(primaryKeySingle, ids, resource)
        ).toString();

        expect(query).toEqual(qs({ id: 'in.(1,2,3)' }));
    });
    it('should return the query for a single id of a resource with a compound key', () => {
        const resource = 'todos';
        const id = '[1,"X"]';
        const query = new URLSearchParams(
            getQuery(primaryKeyCompound, id, resource)
        ).toString();

        expect(query).toEqual(qs({ and: '(id.eq.1,type.eq.X)' }));
    });

    it('should return the query for multiple ids of a resource with a compound key', () => {
        const resource = 'todos';
        const ids = ['[1,"X"]', '[2,"Y"]'];
        const query = new URLSearchParams(
            getQuery(primaryKeyCompound, ids, resource)
        ).toString();

        expect(query).toEqual(
            qs({ or: '(and(id.eq.1,type.eq.X),and(id.eq.2,type.eq.Y))' })
        );
    });
    it('should return the query for a single id of an rpc resource', () => {
        const resource = 'rpc/get_todo';
        const id = 2;
        const query = new URLSearchParams(
            getQuery(primaryKeySingle, id, resource)
        ).toString();

        expect(query).toEqual(qs({ id: 'eq.2' }));
    });

    it('should log to console.error that calling an rpc with multiple ids is not supported', () => {
        const resource = 'rpc/get';
        const ids = [1, 2, 3];

        const spiedConsoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const query = new URLSearchParams(
            getQuery(primaryKeySingle, ids, resource)
        ).toString();
        expect(spiedConsoleError.mock.calls[0][0]).toMatch(
            /no query generation for multiple key values implemented/i
        );
    });

    it('should return the query for a single id of an rpc resource with a compound key', () => {
        const resource = 'rpc/get_todo';
        const id = '[1,"X"]';
        const query = new URLSearchParams(
            getQuery(primaryKeyCompound, id, resource)
        ).toString();

        expect(query).toEqual(qs({ id: 1, type: 'X' }));
    });
});

describe('getKeyData', () => {
    it('should return the key data for a single column primary key', () => {
        const resource = 'todos';
        const primaryKey = getPrimaryKey(resource, resourcePimaryKeys);
        expect(getKeyData(primaryKey, SINGLE_TODO)).toEqual({
            id: SINGLE_TODO.id,
        });
    });
    it('should return the key data for a single column primary key with an alternative name', () => {
        const resource = 'licenses';
        const primaryKey = getPrimaryKey(resource, resourcePimaryKeys);
        expect(getKeyData(primaryKey, SINGLE_LICENSE)).toEqual({
            license_id: SINGLE_LICENSE.license_id,
        });
    });
    it('should return the key data for a multi column primary key', () => {
        const resource = 'contacts';
        const primaryKey = getPrimaryKey(resource, resourcePimaryKeys);
        expect(getKeyData(primaryKey, SINGLE_CONTACT)).toEqual({
            id: SINGLE_CONTACT.id,
            type: SINGLE_CONTACT.type,
        });
    });
});

describe('getOrderBy', () => {
    it('should return an order by string for an id column', () => {
        expect(getOrderBy('id', 'DESC', primaryKeySingle)).toBe('id.desc');
    });
    it('should return an order by string for any other column', () => {
        expect(getOrderBy('xxx', 'ASC', primaryKeySingle)).toBe('xxx.asc');
    });
});
