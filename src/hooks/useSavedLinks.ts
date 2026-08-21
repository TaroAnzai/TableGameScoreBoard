import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { type SavedLinkInput, savedLinkStorage } from '@/src/storage/savedLinkStorage';
import type { SavedLink } from '@/src/types/savedLink';

export const SAVED_LINKS_QUERY_KEY = ['savedLinks'] as const;

const EMPTY_SAVED_LINKS: SavedLink[] = [];

type SavedLinkIdentifier = Pick<SavedLink, 'type' | 'key'>;
type UpdateSavedLinkNameInput = SavedLinkIdentifier & Pick<SavedLink, 'name'>;

const matchesSavedLink = (link: SavedLink, { type, key }: SavedLinkIdentifier) =>
  link.type === type && link.key === key;

const upsertCachedSavedLink = (links: SavedLink[] | undefined, savedLink: SavedLink) => {
  const currentLinks = links ?? EMPTY_SAVED_LINKS;
  const identifier = { type: savedLink.type, key: savedLink.key };

  return currentLinks.some((link) => matchesSavedLink(link, identifier))
    ? currentLinks.map((link) => (matchesSavedLink(link, identifier) ? savedLink : link))
    : [...currentLinks, savedLink];
};

const replaceCachedSavedLink = (links: SavedLink[] | undefined, savedLink: SavedLink) => {
  if (!links) {
    return links;
  }

  const identifier = { type: savedLink.type, key: savedLink.key };
  return links.map((link) => (matchesSavedLink(link, identifier) ? savedLink : link));
};

export const useSavedLinks = () => {
  const queryClient = useQueryClient();
  const savedLinksQuery = useQuery({
    queryKey: SAVED_LINKS_QUERY_KEY,
    queryFn: () => savedLinkStorage.getSavedLinks(),
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: SAVED_LINKS_QUERY_KEY }),
    [queryClient],
  );

  const saveMutation = useMutation({
    mutationFn: (input: SavedLinkInput) => savedLinkStorage.upsertSavedLink(input),
    onSuccess: (savedLink) => {
      queryClient.setQueryData<SavedLink[]>(SAVED_LINKS_QUERY_KEY, (links) =>
        upsertCachedSavedLink(links, savedLink),
      );
    },
  });
  const removeMutation = useMutation({
    mutationFn: ({ type, key }: SavedLinkIdentifier) => savedLinkStorage.removeSavedLink(type, key),
    onSuccess: (_result, identifier) => {
      queryClient.setQueryData<SavedLink[]>(SAVED_LINKS_QUERY_KEY, (links) =>
        links?.filter((link) => !matchesSavedLink(link, identifier)),
      );
    },
  });
  const touchMutation = useMutation({
    mutationFn: ({ type, key }: SavedLinkIdentifier) => savedLinkStorage.touchSavedLink(type, key),
    onSuccess: (savedLink) => {
      if (!savedLink) {
        return;
      }

      queryClient.setQueryData<SavedLink[]>(SAVED_LINKS_QUERY_KEY, (links) =>
        replaceCachedSavedLink(links, savedLink),
      );
    },
  });
  const updateNameMutation = useMutation({
    mutationFn: ({ type, key, name }: UpdateSavedLinkNameInput) =>
      savedLinkStorage.updateSavedLinkName(type, key, name),
    onSuccess: (savedLink) => {
      if (!savedLink) {
        return;
      }

      queryClient.setQueryData<SavedLink[]>(SAVED_LINKS_QUERY_KEY, (links) =>
        replaceCachedSavedLink(links, savedLink),
      );
    },
  });

  return {
    savedLinks: savedLinksQuery.data ?? EMPTY_SAVED_LINKS,
    isLoading: savedLinksQuery.isLoading,
    isFetching: savedLinksQuery.isFetching,
    isError: savedLinksQuery.isError,
    error: savedLinksQuery.error,
    refresh,
    save: saveMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    touch: touchMutation.mutateAsync,
    updateName: updateNameMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
    isTouching: touchMutation.isPending,
    isUpdatingName: updateNameMutation.isPending,
  };
};
