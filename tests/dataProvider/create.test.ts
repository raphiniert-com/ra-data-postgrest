import { SINGLE_TODO } from '../fixtures';
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
            },
        },
    ];

    cases.forEach(makeTestFromCase);
});
