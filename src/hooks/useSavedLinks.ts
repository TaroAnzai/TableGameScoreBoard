import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { type SavedLinkInput,savedLinkStorage } from '@/src/storage/savedLinkStorage';
import type { SavedLink } from '@/src/types/savedLink';

export const SAVED_LINKS_QUERY_KEY = ['savedLinks'] as const;

const EMPTY_SAVED_LINKS: SavedLink[] = [];

type SavedLinkIdentifier = Pick<SavedLink, 'type' | 'key'>;
type UpdateSavedLinkNameInput = SavedLinkIdentifier & Pick<SavedLink, 'name'>;

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
    onSuccess: refresh,
  });
  const removeMutation = useMutation({
    mutationFn: ({ type, key }: SavedLinkIdentifier) => savedLinkStorage.removeSavedLink(type, key),
    onSuccess: refresh,
  });
  const touchMutation = useMutation({
    mutationFn: ({ type, key }: SavedLinkIdentifier) => savedLinkStorage.touchSavedLink(type, key),
    onSuccess: refresh,
  });
  const updateNameMutation = useMutation({
    mutationFn: ({ type, key, name }: UpdateSavedLinkNameInput) =>
      savedLinkStorage.updateSavedLinkName(type, key, name),
    onSuccess: refresh,
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
