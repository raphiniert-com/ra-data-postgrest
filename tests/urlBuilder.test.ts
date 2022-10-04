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
import { SINGLE_CONTACT, SINGLE_LICENSE, SINGLE_TODO } from './mockup.data';

const primaryKeySingle: PrimaryKey = ['id'];
const primaryKeyMulti: PrimaryKey = ['id', 'type'];
const resourcePimaryKeys = new Map<string, PrimaryKey>();
resourcePimaryKeys.set('contacts', primaryKeyMulti);
resourcePimaryKeys.set('licenses', ['license_id']);

describe('parseFilters', () => {
    // TODO: add tests
});

describe('getPrimaryKey', () => {
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
    it('should decode from the encoded id the original id', () => {
        expect(decodeId(1, primaryKeySingle)).toEqual(['1']);
        expect(decodeId(1, ['license_id'])).toEqual(['1']);
        expect(decodeId('[1,"X"]', primaryKeyMulti)).toEqual([1, 'X']);
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
        expect(encodeId(SINGLE_CONTACT, primaryKeyMulti)).toEqual('[1,"X"]');
    });
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
