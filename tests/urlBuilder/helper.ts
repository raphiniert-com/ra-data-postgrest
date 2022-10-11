export const qs = (queryParams: Record<string, any>) =>
    new URLSearchParams(queryParams).toString();
