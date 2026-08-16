import type { ShareLink, ShareLinkV2 } from '@/src/api/generated/mahjongApi.schemas';

const levelPriority: Record<string, number> = {
  VIEW: 1,
  EDIT: 2,
  OWNER: 3,
};

export const getAccessLevelstring = (
  shereLinks: readonly (ShareLink | ShareLinkV2)[] | undefined,
) => {
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
  readonly group_links?: readonly (ShareLink | ShareLinkV2)[];
  readonly tournament_links?: readonly (ShareLink | ShareLinkV2)[];
  readonly table_links?: readonly (ShareLink | ShareLinkV2)[];
};

/** Select the most privileged key returned for a resource. */
export const getResourceKey = (links: ResourceLinks | null | undefined) => {
  if (!links) return undefined;
  const shareLinks = links.group_links ?? links.tournament_links ?? links.table_links;
  const highest = shareLinks?.reduce<ShareLink | ShareLinkV2 | undefined>((current, link) => {
    if (!current || levelPriority[link.access_level] > levelPriority[current.access_level]) {
      return link;
    }
    return current;
  }, undefined);
  return links.owner_link ?? links.edit_link ?? links.view_link ?? highest?.short_key;
};
