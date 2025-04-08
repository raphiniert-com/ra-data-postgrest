import { PrimaryKey } from '../src/urlBuilder';

export const primaryKeySingle: PrimaryKey = ['id'];
export const primaryKeyCompound: PrimaryKey = ['id', 'type'];
export const resourcePrimaryKeys = new Map<string, PrimaryKey>();
resourcePrimaryKeys.set('contacts', primaryKeyCompound);
resourcePrimaryKeys.set('licenses', ['license_id']);
resourcePrimaryKeys.set('todos', ['id']);

export const SINGLE_TODO = {
    id: 2,
    todo: 'item_2',
    private: true,
    mine: false,
    user_id: 3,
};

export const TODO_LIST = [
    {
        id: 1,
        todo: 'item_1',
        private: false,
        mine: true,
        user_id: 1,
    },
    {
        id: 2,
        todo: 'item_2',
        private: true,
        mine: false,
        user_id: 3,
    },
    {
        id: 3,
        todo: 'item_3',
        private: false,
        mine: false,
        user_id: 2,
    },
    {
        id: 4,
        todo: 'item_4',
        private: true,
        mine: true,
        user_id: 1,
    },
    {
        id: 5,
        todo: 'item_5',
        private: true,
        mine: false,
        user_id: 3,
    },
    {
        id: 6,
        todo: 'item_6',
        private: false,
        mine: false,
        user_id: 2,
    },
];

export const TODO_LIST_WITH_PREFETCHED_TAGS_USER = [
    {
        id: 1,
        todo: 'item_1',
        private: false,
        mine: true,
        user_id: 1,
        users: { id: 1, name: 'user_1' },
        tags: [{ id: 1, name: 'tag_1' }],
    },
    {
        id: 2,
        todo: 'item_2',
        private: true,
        mine: false,
        user_id: 3,
        users: { id: 3, name: 'user_3' },
        tags: [{ id: 1, name: 'tag_1' }],
    },
    {
        id: 3,
        todo: 'item_3',
        private: false,
        mine: false,
        user_id: 2,
        users: { id: 2, name: 'user_2' },
        tags: [
            { id: 1, name: 'tag_1' },
            { id: 2, name: 'tag_2' },
        ],
    },
    {
        id: 4,
        todo: 'item_4',
        private: true,
        mine: true,
        user_id: 1,
        users: { id: 1, name: 'user_1' },
        tags: [{ id: 2, name: 'tag_2' }],
    },
    {
        id: 5,
        todo: 'item_5',
        private: true,
        mine: false,
        user_id: 3,
        users: { id: 3, name: 'user_3' },
        tags: [
            { id: 2, name: 'tag_2' },
            { id: 3, name: 'tag_3' },
        ],
    },
    {
        id: 6,
        todo: 'item_6',
        private: false,
        mine: false,
        user_id: 2,
        users: { id: 2, name: 'user_2' },
        tags: [{ id: 4, name: 'tag_4' }],
    },
];

export const PREFETCHED_TAGS = [
    { id: 1, name: 'tag_1' },
    { id: 2, name: 'tag_2' },
    { id: 3, name: 'tag_3' },
    { id: 4, name: 'tag_4' },
];

export const PREFETCHED_USERS = [
    { id: 1, name: 'user_1' },
    { id: 3, name: 'user_3' },
    { id: 2, name: 'user_2' },
];

export const SINGLE_TODO_WITH_USER =  {
    id: 2,
    todo: 'item_2',
    private: true,
    mine: false,
    user_id: 3,
    users: { id: 3, name: 'user_3' },
};

export const SINGLE_TODO_WITH_TAGS_USER =  {
    id: 2,
    todo: 'item_2',
    private: true,
    mine: false,
    user_id: 3,
    users: { id: 3, name: 'user_3' },
    tags: [{ id: 1, name: 'tag_1' }],
};

export const SINGLE_CONTACT = {
    id: 1,
    type: 'X',
    labels: ['A', 'B'],
    name: 'Mister X',
};

export const CONTACT_LIST = [
    { ...SINGLE_CONTACT },
    {
        id: 2,
        type: 'Y',
        labels: ['A', 'C'],
        name: 'Mister Y',
    },
];

export const SINGLE_LICENSE = {
    license_id: '000aba4f-3011-4059-a7c1-7462dd053862',
    user_id: 1,
};

export const LICENSE_LIST = [
    { ...SINGLE_LICENSE },
    {
        license_id: '111f688f-9863-4bf0-a885-ffd4d38d6ece',
        user_id: 2,
    },
];
