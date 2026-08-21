import { useCallback, useMemo, useState } from 'react';

import { useSavedLinks } from '@/src/hooks/useSavedLinks';
import type { SavedLink } from '@/src/types/savedLink';

type UseSavedPageParams = {
  type: SavedLink['type'];
  key?: string;
  name?: string;
  accessLevel?: SavedLink['accessLevel'];
  tournamentKey?: string;
  parentGroupName?: string;
  parentTournamentName?: string;
  isDirectView: boolean;
};

export const useSavedPage = ({
  type,
  key,
  name,
  accessLevel,
  tournamentKey,
  parentGroupName,
  parentTournamentName,
  isDirectView,
}: UseSavedPageParams) => {
  const [dismissedPage, setDismissedPage] = useState<string>();
  const { savedLinks, isLoading, isError, error, save, remove, touch, isSaving, isRemoving } =
    useSavedLinks();
  const isSaved = useMemo(
    () => Boolean(key && savedLinks.some((link) => link.type === type && link.key === key)),
    [key, savedLinks, type],
  );
  const canSave = Boolean(key && name);
  const pageIdentifier = `${type}:${key ?? ''}`;
  const hasDismissedPrompt = dismissedPage === pageIdentifier;

  const saveCurrentPage = useCallback(async () => {
    if (!key || !name) {
      throw new Error('A saved page requires a key and name.');
    }

    return save({
      type,
      key,
      name,
      tournamentKey,
      parentGroupName,
      parentTournamentName,
      accessLevel,
    });
  }, [key, name, parentGroupName, parentTournamentName, save, tournamentKey, type, accessLevel]);

  const removeCurrentPage = useCallback(async () => {
    if (!key) {
      return;
    }

    await remove({ type, key });
  }, [key, remove, type]);

  const touchCurrentPage = useCallback(async () => {
    if (!key) {
      return;
    }

    return touch({ type, key });
  }, [key, touch, type]);

  return {
    isSaved,
    canSave,
    save: saveCurrentPage,
    remove: removeCurrentPage,
    touch: touchCurrentPage,
    isSaving,
    isRemoving,
    shouldPromptSave:
      isDirectView && !isLoading && !isError && !isSaved && canSave && !hasDismissedPrompt,
    dismissSavePrompt: () => setDismissedPage(pageIdentifier),
    hasDismissedPrompt,
    isLoading,
    isError,
    error,
  };
};
