import { getOrderBy, PrimaryKey } from '../src/urlBuilder';

const primaryKey: PrimaryKey = ['id'];

describe('getOrderBy', () => {
    it('ordering by the id column returns string', () => {
        expect(getOrderBy('id', 'DESC', primaryKey)).toBe('id.desc');
    });
    it('ordering by another column returns string', () => {
        expect(getOrderBy('xxx', 'ASC', primaryKey)).toBe('xxx.asc');
    });
});
