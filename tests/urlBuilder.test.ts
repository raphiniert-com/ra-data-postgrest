import { getOrderBy, PrimaryKey } from '../src/urlBuilder';

const primaryKey: PrimaryKey = ['id'];

describe('getOrderBy', () => {
    it('should return an order by string for an id column', () => {
        expect(getOrderBy('id', 'DESC', primaryKey)).toBe('id.desc');
    });
    it('should return an order by string for any other column', () => {
        expect(getOrderBy('xxx', 'ASC', primaryKey)).toBe('xxx.asc');
    });
});
