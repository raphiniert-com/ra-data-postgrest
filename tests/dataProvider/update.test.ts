import qs from 'qs';
import { makeTestFromCase, Case } from './helper';
import dataProviderBuilder from '../../src';
import { SINGLE_TODO, SINGLE_TODO_WITH_TAGS_USER } from '../fixtures';

describe('update specific', () => {
    const method = 'update';

    const cases: Case[] = [
        {
            test: 'Update resource with compound primary key',
            method,
            resource: 'contacts',
            params: {
                id: JSON.stringify([1, 'X']),
                data: { name: 'new name', unchanged: 'value' },
                previousData: { name: 'old name', unchanged: 'value' },
                meta: {},
            },
            expectedUrl: '/contacts?'.concat(
                qs.stringify({ and: '(id.eq.1,type.eq.X)' })
            ),
            expectedOptions: {
                method: 'PATCH',
                body: JSON.stringify({ name: 'new name' }),
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
        },
        {
            test: 'should not remove the embedded data from the result nor add it to the meta',
            method,
            resource: 'todos',
            params: {
                id: 2,
                data: { todo: 'item_2' },
                previousData: { name: 'item_2_old' },
                meta: { embed: ['tags', 'users'] },
            },
            httpClientResponseBody: SINGLE_TODO_WITH_TAGS_USER,
            expectedUrl:
                '/todos?id=eq.2&select=%2A%2Ctags%28%2A%29%2Cusers%28%2A%29',
            expectedOptions: {
                method: 'PATCH',
                body: JSON.stringify({ todo: 'item_2' }),
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
            expectedResult: {
                data: SINGLE_TODO_WITH_TAGS_USER,
                meta: undefined,
            },
        },
        {
            test: 'should remove the prefetched data from the result and add it to the meta',
            method,
            resource: 'todos',
            params: {
                id: 2,
                data: { todo: 'item_2' },
                previousData: { name: 'item_2_old' },
                meta: { prefetch: ['tags', 'users'] },
            },
            httpClientResponseBody: SINGLE_TODO_WITH_TAGS_USER,
            expectedUrl:
                '/todos?id=eq.2&select=%2A%2Ctags%28%2A%29%2Cusers%28%2A%29',
            expectedOptions: {
                method: 'PATCH',
                body: JSON.stringify({ todo: 'item_2' }),
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
            expectedResult: {
                data: SINGLE_TODO,
                meta: {
                    prefetched: {
                        tags: [{ id: 1, name: 'tag_1' }],
                        users: [{ id: 3, name: 'user_3' }],
                    },
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);

    it('should not fail when no changes are requested', async () => {
        const dataProvider = dataProviderBuilder({} as any);
        const { data } = await dataProvider.update('posts', {
            id: 123,
            data: { foo: 'bar' },
            previousData: { id: 123, foo: 'bar' },
        });
        expect(data).toEqual({ id: 123, foo: 'bar' });
    });
});
