import type { ShareLink } from '@/src/api/generated/mahjongApi.schemas';

const levelPriority: Record<string, number> = {
  VIEW: 1,
  EDIT: 2,
  OWNER: 3,
};

export const getAccessLevelstring = (shereLinks: readonly ShareLink[] | undefined) => {
  if (!shereLinks || !shereLinks.length) return 'VIEW';
  const accessLevel = shereLinks.reduce((highest, current) => {
    return levelPriority[current.access_level] > levelPriority[highest.access_level]
      ? current
      : highest;
  }).access_level;
  return accessLevel ?? 'VIEW';
};

type ResourceLinks = {
  readonly owner_link?: string;
  readonly edit_link?: string;
  readonly view_link?: string;
};

/** Select the most privileged key returned for a resource. */
export const getResourceKey = (links: ResourceLinks | null | undefined) =>
  links?.owner_link ?? links?.edit_link ?? links?.view_link;
