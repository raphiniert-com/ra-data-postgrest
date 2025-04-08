import qs from 'qs';
import { makeTestFromCase, Case } from './helper';
import { SINGLE_TODO, SINGLE_TODO_WITH_TAGS_USER } from '../fixtures';

describe('getOne specific', () => {
    const method = 'getOne';
    const expectedOptions = {
        headers: {
            accept: 'application/vnd.pgrst.object+json',
        },
    };

    const cases: Case[] = [
        {
            test: 'normal resource',
            method,
            resource: 'todos',
            params: {
                id: 2,
            },
            expectedUrl: `/todos?id=eq.2`,
            expectedOptions,
        },
        {
            test: 'normal resource with compound primary key',
            method,
            resource: 'contacts',
            params: {
                id: JSON.stringify([1, 'X']),
            },
            expectedUrl: '/contacts?'.concat(
                qs.stringify({ and: '(id.eq.1,type.eq.X)' })
            ),
            expectedOptions,
        },
        {
            test: 'rpc resource',
            method,
            resource: 'rpc/get_todo',
            params: {
                id: 2,
            },
            // TODO: I would actually expect `/rpc/get_todo?id=2`, wouldn't you?
            expectedUrl: `/rpc/get_todo?id=eq.2`,
            expectedOptions,
        },
        // TODO: Decide what to actually expect here!
        // {
        //     test: 'rpc resource with compound primary key',
        //     method,
        //     resource: 'rpc/get_contact',
        //     params: {
        //         id: JSON.stringify([1, 'X']),
        //     },
        //     expectedUrl: `/rpc/get_contact?and=(id.eq.1,type.eq.X)`,
        //     expectedOptions,
        // },
        {
            test: 'should not remove the embedded data from the result nor add it to the meta',
            method,
            resource: 'todos',
            params: {
                id: 2,
                meta: { embed: ['tags', 'users'] },
            },
            httpClientResponseBody: SINGLE_TODO_WITH_TAGS_USER,
            expectedUrl:
                '/todos?id=eq.2&select=%2A%2Ctags%28%2A%29%2Cusers%28%2A%29',
            expectedOptions,
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
                meta: { prefetch: ['tags', 'users'] },
            },
            httpClientResponseBody: SINGLE_TODO_WITH_TAGS_USER,
            expectedUrl:
                '/todos?id=eq.2&select=%2A%2Ctags%28%2A%29%2Cusers%28%2A%29',
            expectedOptions,
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
});
