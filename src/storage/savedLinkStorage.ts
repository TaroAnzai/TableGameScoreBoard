import AsyncStorage from '@react-native-async-storage/async-storage';

import { ShareLinkV2AccessLevel } from '@/src/api/generated/mahjongApi.schemas';
import type { SavedLink } from '@/src/types/savedLink';

const SAVED_LINKS_KEY = 'savedLinks';

export type SavedLinkInput = Pick<
  SavedLink,
  | 'type'
  | 'key'
  | 'name'
  | 'tournamentKey'
  | 'parentGroupName'
  | 'parentTournamentName'
  | 'accessLevel'
>;

let mutationQueue: Promise<void> = Promise.resolve();

const runSerialized = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = mutationQueue.then(operation, operation);

  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
};

const isSavedLink = (value: unknown): value is SavedLink => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const link = value as Record<string, unknown>;

  return (
    (link.type === 'tournament' || link.type === 'table') &&
    typeof link.key === 'string' &&
    typeof link.name === 'string' &&
    (link.accessLevel === undefined ||
      Object.values(ShareLinkV2AccessLevel).includes(link.accessLevel as ShareLinkV2AccessLevel)) &&
    (link.tournamentKey === undefined || typeof link.tournamentKey === 'string') &&
    (link.parentGroupName === undefined || typeof link.parentGroupName === 'string') &&
    (link.parentTournamentName === undefined || typeof link.parentTournamentName === 'string') &&
    typeof link.savedAt === 'string' &&
    typeof link.lastOpenedAt === 'string'
  );
};

const matchesSavedLink = (link: SavedLink, type: SavedLink['type'], key: string) =>
  link.type === type && link.key === key;

const writeSavedLinks = (links: SavedLink[]) =>
  AsyncStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(links));

const readSavedLinks = async (): Promise<{ links: SavedLink[]; needsRepair: boolean }> => {
  const value = await AsyncStorage.getItem(SAVED_LINKS_KEY);

  if (!value) {
    return { links: [], needsRepair: false };
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return { links: [], needsRepair: true };
    }

    const links = parsed.filter(isSavedLink);
    return { links, needsRepair: links.length !== parsed.length };
  } catch {
    return { links: [], needsRepair: true };
  }
};

export const savedLinkStorage = {
  async getSavedLinks(): Promise<SavedLink[]> {
    return runSerialized(async () => {
      const { links, needsRepair } = await readSavedLinks();

      if (needsRepair) {
        await writeSavedLinks(links);
      }

      return links;
    });
  },

  async getSavedLink(type: SavedLink['type'], key: string): Promise<SavedLink | undefined> {
    const links = await this.getSavedLinks();
    return links.find((link) => matchesSavedLink(link, type, key));
  },

  async upsertSavedLink(input: SavedLinkInput): Promise<SavedLink> {
    return runSerialized(async () => {
      const { links } = await readSavedLinks();
      const existing = links.find((link) => matchesSavedLink(link, input.type, input.key));
      const now = new Date().toISOString();
      const link: SavedLink = {
        ...input,
        ...(input.tournamentKey === undefined && existing?.tournamentKey !== undefined
          ? { tournamentKey: existing.tournamentKey }
          : {}),
        ...(input.accessLevel === undefined && existing?.accessLevel !== undefined
          ? { accessLevel: existing.accessLevel }
          : {}),
        ...(input.parentGroupName === undefined && existing?.parentGroupName !== undefined
          ? { parentGroupName: existing.parentGroupName }
          : {}),
        ...(input.parentTournamentName === undefined && existing?.parentTournamentName !== undefined
          ? { parentTournamentName: existing.parentTournamentName }
          : {}),
        savedAt: existing?.savedAt ?? now,
        lastOpenedAt: now,
      };

      await writeSavedLinks([
        ...links.filter((item) => !matchesSavedLink(item, input.type, input.key)),
        link,
      ]);

      return link;
    });
  },

  async removeSavedLink(type: SavedLink['type'], key: string): Promise<void> {
    await runSerialized(async () => {
      const { links } = await readSavedLinks();
      await writeSavedLinks(links.filter((link) => !matchesSavedLink(link, type, key)));
    });
  },

  async touchSavedLink(type: SavedLink['type'], key: string): Promise<SavedLink | undefined> {
    return runSerialized(async () => {
      const { links } = await readSavedLinks();
      const existing = links.find((link) => matchesSavedLink(link, type, key));

      if (!existing) {
        return undefined;
      }

      const updatedLink: SavedLink = {
        ...existing,
        lastOpenedAt: new Date().toISOString(),
      };

      await writeSavedLinks([
        ...links.filter((link) => !matchesSavedLink(link, type, key)),
        updatedLink,
      ]);

      return updatedLink;
    });
  },

  async updateSavedLinkName(
    type: SavedLink['type'],
    key: string,
    name: string,
  ): Promise<SavedLink | undefined> {
    return runSerialized(async () => {
      const { links } = await readSavedLinks();
      const existing = links.find((link) => matchesSavedLink(link, type, key));

      if (!existing) {
        return undefined;
      }

      const updatedLink: SavedLink = { ...existing, name };

      await writeSavedLinks([
        ...links.filter((link) => !matchesSavedLink(link, type, key)),
        updatedLink,
      ]);

      return updatedLink;
    });
  },
};
