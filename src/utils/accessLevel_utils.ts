import type {
  ShareLink,
  ShareLinkV2,
  ShareLinkV2AccessLevel,
} from '@/src/api/generated/mahjongApi.schemas';

const levelPriority: Record<string, number> = {
  VIEW: 1,
  EDIT: 2,
  OWNER: 3,
};

export const getAccessLevelstring = (
  shereLinks: readonly (ShareLink | ShareLinkV2)[] | undefined,
): ShareLinkV2AccessLevel => {
  if (!shereLinks || !shereLinks.length) return 'VIEW';
  const accessLevel = shereLinks.reduce((highest, current) => {
    return (levelPriority[current.access_level] ?? 0) > (levelPriority[highest.access_level] ?? 0)
      ? current
      : highest;
  }).access_level;
  return Object.hasOwn(levelPriority, accessLevel)
    ? (accessLevel as ShareLinkV2AccessLevel)
    : 'VIEW';
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
