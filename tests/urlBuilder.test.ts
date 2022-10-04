import {
    PrimaryKey,
    parseFilters,
    getPrimaryKey,
    decodeId,
    encodeId,
    dataWithId,
    isCompoundKey,
    getQuery,
    getKeyData,
    getOrderBy,
} from '../src/urlBuilder';

const primaryKeySingle: PrimaryKey = ['id'];
const primaryKeyMulti: PrimaryKey = ['id', 'type'];

describe('parseFilters', () => {
    // TODO: add tests
});

describe('getPrimaryKey', () => {
    const resourcePimaryKeys = new Map<string, PrimaryKey>();
    resourcePimaryKeys.set('contacts', primaryKeyMulti);
    resourcePimaryKeys.set('licenses', ['license_id']);

    it('should return the special primary for any resource in the resourcePimaryKeys map', () => {
        expect(getPrimaryKey('contacts', resourcePimaryKeys)).toEqual(
            primaryKeyMulti
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
    // TODO: add tests
});

describe('encodeId', () => {
    // TODO: add tests
});

describe('dataWithId', () => {
    // TODO: add tests
});

describe('isCompoundKey', () => {
    it('should return false if the primaryKey consists of a single column', () => {
        expect(isCompoundKey(primaryKeySingle)).toBe(false);
    });
    it('should return true if the primaryKey consists of multiple columns', () => {
        expect(isCompoundKey(primaryKeyMulti)).toBe(true);
    });
});

describe('getQuery', () => {
    // TODO: add tests
});

describe('getKeyData', () => {
    // TODO: add tests
});

describe('getOrderBy', () => {
    it('should return an order by string for an id column', () => {
        expect(getOrderBy('id', 'DESC', primaryKeySingle)).toBe('id.desc');
    });
    it('should return an order by string for any other column', () => {
        expect(getOrderBy('xxx', 'ASC', primaryKeySingle)).toBe('xxx.asc');
    });
});
