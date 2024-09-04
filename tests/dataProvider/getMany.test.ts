import { makeTestFromCase, Case } from './helper';
import dataProviderBuilder from '../../src';

describe('getMany specific', () => {
    const method = 'getMany';

    const cases: Case[] = [
        {
            test: 'Read a list of resource, by ids',
            method,
            resource: 'posts',
            params: { ids: [1, 2, 3] },
            expectedUrl: `/posts?id=in.%28${encodeURIComponent('1,2,3')}%29`,
            expectedOptions: { headers: {} },
        },
    ];

    cases.forEach(makeTestFromCase);

    it('should not fail when no ids are provided', async () => {
        const dataProvider = dataProviderBuilder({} as any);
        const { data } = await dataProvider.getMany('posts', { ids: [] });
        expect(data).toEqual([]);
    });
});
