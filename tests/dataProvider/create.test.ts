import { SINGLE_TODO, SINGLE_TODO_WITH_USER } from '../fixtures';
import { makeTestFromCase, Case } from './helper';

describe('create specific', () => {
    const method = 'create';

    const cases: Case[] = [
        {
            test: 'should return the data returned by Postgrest and not the posted data',
            method,
            resource: 'todos',
            params: {
                data: {
                    todo: SINGLE_TODO.todo,
                    user_id: SINGLE_TODO.user_id,
                },
            },
            expectedUrl: '/todos',
            expectedOptions: {
                method: 'POST',
                body: JSON.stringify({
                    todo: SINGLE_TODO.todo,
                    user_id: SINGLE_TODO.user_id,
                }),
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
            httpClientResponseBody: SINGLE_TODO,
            expectedResult: {
                data: SINGLE_TODO,
                meta: undefined,
            },
        },
        {
            test: 'should not remove the embedded data from the result nor add it to the meta',
            method,
            resource: 'todos',
            params: {
                data: {
                    todo: SINGLE_TODO.todo,
                    user_id: SINGLE_TODO.user_id,
                },
                meta: { embed: ['users'] },
            },
            httpClientResponseBody: SINGLE_TODO_WITH_USER,
            expectedUrl: '/todos?select=%2A%2Cusers%28%2A%29',
            expectedOptions: {
                method: 'POST',
                body: JSON.stringify({
                    todo: SINGLE_TODO.todo,
                    user_id: SINGLE_TODO.user_id,
                }),
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
            expectedResult: {
                data: SINGLE_TODO_WITH_USER,
                meta: undefined,
            },
        },
        {
            test: 'should remove the prefetched data from the result and add it to the meta',
            method,
            resource: 'todos',
            params: {
                data: {
                    todo: SINGLE_TODO.todo,
                    user_id: SINGLE_TODO.user_id,
                },
                meta: { prefetch: ['users'] },
            },
            httpClientResponseBody: SINGLE_TODO_WITH_USER,
            expectedUrl: '/todos?select=%2A%2Cusers%28%2A%29',
            expectedOptions: {
                method: 'POST',
                body: JSON.stringify({
                    todo: SINGLE_TODO.todo,
                    user_id: SINGLE_TODO.user_id,
                }),
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
                        users: [{ id: 3, name: 'user_3' }],
                    },
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);
});
