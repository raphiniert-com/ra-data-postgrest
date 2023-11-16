import {
    parseFilters,
    getPrimaryKey,
    decodeId,
    encodeId,
    dataWithVirtualId,
    getQuery,
    getOrderBy,
} from '../../src/urlBuilder';
import {
    SINGLE_CONTACT,
    SINGLE_LICENSE,
    SINGLE_TODO,
    primaryKeyCompound,
    primaryKeySingle,
    resourcePrimaryKeys,
} from '../fixtures';

describe('parseFilters', () => {
    it('should parse filters', () => {
        expect(
            parseFilters(
                {
                    filter: {
                        q1: 'foo',
                        'q2@ilike': 'bar',
                        'q3@like': 'baz qux',
                        'q4@gt': 'c',
                        'q5@cs': '{foo}',
                        'q6@cs': ['foo', 'bar'],
                        'q7@cd': '{foo}',
                        'q8@cd': ['foo', 'bar'],
                        q9: { 'foo@ilike': 'bar'},
                        q10: { 'foo@like': 'baz qux'},
                        q11: { 'foo@gt': 'c'},
                        q12: { 'foo@cs': '{bar}'},
                        q13: { 'foo@cs': ['foo', 'bar']},
                        q14: { 'foo@cd': '{bar}'},
                        q15: { 'foo@cd': ['foo', 'bar']},
                        q16: { 'foo': {'bar@cs': ['foo', 'bar']}},
                        'q17@cd': '["foo","bar"]',
                        'q18@cd': JSON.stringify({ 'foo': 'bar' }),
                    }
                },
                'eq'
            )
        ).toEqual({
            filter: {
                q1: 'eq.foo',
                q2: 'ilike.*bar*',
                q3: ['like.*baz*', 'like.*qux*'],
                q4: 'gt.c',
                q5: 'cs.{foo}',
                q6: 'cs.{foo,bar}',
                q7: 'cd.{foo}',
                q8: 'cd.{foo,bar}',
                'q9.foo':'ilike.*bar*',
                'q10.foo': ['like.*baz*', 'like.*qux*'],
                'q11.foo': 'gt.c',
                'q12.foo': 'cs.{bar}',
                'q13.foo': 'cs.{foo,bar}',
                'q14.foo': 'cd.{bar}',
                'q15.foo': 'cd.{foo,bar}',
                'q16.foo.bar': 'cs.{foo,bar}',
                'q17': 'cd.["foo","bar"]',
                'q18': 'cd.{"foo":"bar"}',
            }
         });
    });
    it('should parse filters with one select fields', () => {
        expect(
            parseFilters(
                {
                    filter: {
                        q1: 'foo',
                        'q2@ilike': 'bar',
                        'q3@like': 'baz qux',
                        'q4@gt': 'c',
                    },
                    meta: { columns: 'title' }
                },
                'eq'
            )
        ).toEqual({
            filter: {
                q1: 'eq.foo',
                q2: 'ilike.*bar*',
                q3: ['like.*baz*', 'like.*qux*'],
                q4: 'gt.c'
            },
            select: 'title'
         });
    });
    it('should parse filters with multiple select fields', () => {
        expect(
            parseFilters(
                {
                    filter: {
                        q1: 'foo',
                        'q2@ilike': 'bar',
                        'q3@like': 'baz qux',
                        'q4@gt': 'c',
                    },
                    meta: { columns: ['id', 'title'] }
                },
                'eq'
            )
        ).toEqual({
            filter: {
                q1: 'eq.foo',
                q2: 'ilike.*bar*',
                q3: ['like.*baz*', 'like.*qux*'],
                q4: 'gt.c',
            },
            select: 'id,title',
        });
    });
    it('should parse filters of logical operator', () => {
        const { filter } = parseFilters(
            {
                filter: {
                    '@or': {
                        'age@lt': 18,
                        'age@gt': 21,
                        q1: 'foo',
                        'q2@ilike': 'bar',
                        'q3@like': 'baz qux',
                        'q4@gt': 'c',
                    },
                },
                meta: { columns: ['id', 'title'] },
            },
            'eq'
        );
        expect(filter).toEqual({
            or: '(age.lt.18,age.gt.21,q1.eq.foo,q2.ilike.*bar*,q3.like.*baz*,q3.like.*qux*,q4.gt.c)',
        });
    });
});

describe('getPrimaryKey', () => {
    it('should return the special primary for any resource in the resourcePrimaryKeys map', () => {
        expect(getPrimaryKey('contacts', resourcePrimaryKeys)).toEqual(
            primaryKeyCompound
        );
        expect(getPrimaryKey('licenses', resourcePrimaryKeys)).toEqual([
            'license_id',
        ]);
    });
    it("should return the regular primary ['id'] for any other resource", () => {
        expect(getPrimaryKey('todos', resourcePrimaryKeys)).toEqual(
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
        expect(dataWithVirtualId(SINGLE_TODO, primaryKeySingle)).toEqual(SINGLE_TODO);
    });
    it('should return the data with the id field added if the primary key is a compound', () => {
        expect(dataWithVirtualId(SINGLE_CONTACT, primaryKeyCompound)).toEqual({
            ...SINGLE_CONTACT,
            id: '[1,"X"]',
        });
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
        const query = getQuery(primaryKeySingle, id, resource);

        expect(query).toEqual({ id: 'eq.2' });
    });

    it('should return the query for a single id of normal resource with one select fields', () => {
        const resource = 'todos';
        const id = 2;
        const meta = { columns: 'field' };
        const query = getQuery(primaryKeySingle, id, resource, meta);

        expect(query).toEqual({ id: 'eq.2', select: 'field' });
    });

    it('should return the query for a single id of normal resource with multiple select fields', () => {
        const resource = 'todos';
        const id = 2;
        const meta = { columns: ['id', 'field'] };
        const query = getQuery(primaryKeySingle, id, resource, meta);

        expect(query).toEqual({ id: 'eq.2', select: 'id,field' });
    });

    it('should return the query for multiple ids of normal resource', () => {
        const resource = 'todos';
        const ids = [1, 2, 3];
        const query = getQuery(primaryKeySingle, ids, resource);

        expect(query).toEqual({ id: 'in.(1,2,3)' });
    });
    it('should return the query for a single id of a resource with a compound key', () => {
        const resource = 'todos';
        const id = '[1,"X"]';
        const query = getQuery(primaryKeyCompound, id, resource);

        expect(query).toEqual({and: '(id.eq.1,type.eq.X)'});
    });

    it('should return the query for multiple ids of a resource with a compound key', () => {
        const resource = 'todos';
        const ids = ['[1,"X"]', '[2,"Y"]'];
        const query = getQuery(primaryKeyCompound, ids, resource);

        expect(query).toEqual({
            or: '(and(id.eq.1,type.eq.X),and(id.eq.2,type.eq.Y))'
        });
    });
    it('should return the query for a single id of an rpc resource', () => {
        const resource = 'rpc/get_todo';
        const id = 2;
        const query = getQuery(primaryKeySingle, id, resource);

        expect(query).toEqual({ id: 'eq.2' });
    });

    it('should log to console.error that calling an rpc with multiple ids is not supported', () => {
        const resource = 'rpc/get';
        const ids = [1, 2, 3];

        const spiedConsoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const query = getQuery(primaryKeySingle, ids, resource);
        expect(spiedConsoleError.mock.calls[0][0]).toMatch(
            /no query generation for multiple key values implemented/i
        );
    });

    it('should return the query for a single id of an rpc resource with a compound key', () => {
        const resource = 'rpc/get_todo';
        const id = '[1,"X"]';
        const query = getQuery(primaryKeyCompound, id, resource);

        expect(query).toEqual({id: '1', type:'X'});
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
