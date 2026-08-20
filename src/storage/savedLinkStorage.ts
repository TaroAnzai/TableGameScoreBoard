import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SavedLink } from '@/src/types/savedLink';

const SAVED_LINKS_KEY = 'savedLinks';

export type SavedLinkInput = Pick<SavedLink, 'type' | 'key' | 'name' | 'tournamentKey'>;

const isSavedLink = (value: unknown): value is SavedLink => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const link = value as Record<string, unknown>;

  return (
    (link.type === 'tournament' || link.type === 'table') &&
    typeof link.key === 'string' &&
    typeof link.name === 'string' &&
    (link.tournamentKey === undefined || typeof link.tournamentKey === 'string') &&
    typeof link.savedAt === 'string' &&
    typeof link.lastOpenedAt === 'string'
  );
};

const matchesSavedLink = (link: SavedLink, type: SavedLink['type'], key: string) =>
  link.type === type && link.key === key;

const writeSavedLinks = (links: SavedLink[]) =>
  AsyncStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(links));

export const savedLinkStorage = {
  async getSavedLinks(): Promise<SavedLink[]> {
    const value = await AsyncStorage.getItem(SAVED_LINKS_KEY);

    if (!value) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        await writeSavedLinks([]);
        return [];
      }

      const links = parsed.filter(isSavedLink);

      if (links.length !== parsed.length) {
        await writeSavedLinks(links);
      }

      return links;
    } catch {
      await writeSavedLinks([]);
      return [];
    }
  },

  async getSavedLink(type: SavedLink['type'], key: string): Promise<SavedLink | undefined> {
    const links = await this.getSavedLinks();
    return links.find((link) => matchesSavedLink(link, type, key));
  },

  async upsertSavedLink(input: SavedLinkInput): Promise<SavedLink> {
    const links = await this.getSavedLinks();
    const existing = links.find((link) => matchesSavedLink(link, input.type, input.key));
    const now = new Date().toISOString();
    const link: SavedLink = {
      ...input,
      ...(input.tournamentKey === undefined && existing?.tournamentKey !== undefined
        ? { tournamentKey: existing.tournamentKey }
        : {}),
      savedAt: existing?.savedAt ?? now,
      lastOpenedAt: now,
    };

    await writeSavedLinks([
      ...links.filter((item) => !matchesSavedLink(item, input.type, input.key)),
      link,
    ]);

    return link;
  },

  async removeSavedLink(type: SavedLink['type'], key: string): Promise<void> {
    const links = await this.getSavedLinks();
    await writeSavedLinks(links.filter((link) => !matchesSavedLink(link, type, key)));
  },

  async touchSavedLink(type: SavedLink['type'], key: string): Promise<SavedLink | undefined> {
    const links = await this.getSavedLinks();
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
  },

  async updateSavedLinkName(
    type: SavedLink['type'],
    key: string,
    name: string,
  ): Promise<SavedLink | undefined> {
    const links = await this.getSavedLinks();
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
  },
};
