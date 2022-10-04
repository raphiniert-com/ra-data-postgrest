import { getOrderBy, isCompoundKey, PrimaryKey } from '../src/urlBuilder';

const primaryKeySingle: PrimaryKey = ['id'];
const primaryKeyMulti: PrimaryKey = ['id', 'type'];

describe('isCompoundKey', () => {
    it('should return false if the primaryKey consists of a single column', () => {
        expect(isCompoundKey(primaryKeySingle)).toBe(false);
    });
    it('should return true if the primaryKey consists of multiple columns', () => {
        expect(isCompoundKey(primaryKeyMulti)).toBe(true);
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
