export type PageDir = 'up' | 'down';

export const pageDirStore = $state<{ dir: PageDir }>({ dir: 'down' });
