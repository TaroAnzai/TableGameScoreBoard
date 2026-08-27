import { useGlobalSearchParams, useNavigation } from 'expo-router';
import type { NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSavedLinks } from '@/src/hooks/useSavedLinks';
import type { SavedLink } from '@/src/types/savedLink';
import { EXTERNAL_ENTRY_PARAM } from '@/src/utils/externalNavigation';

type UseSavedPageParams = {
  type: SavedLink['type'];
  key?: string;
  name?: string;
  accessLevel?: SavedLink['accessLevel'];
  tournamentKey?: string;
  parentGroupName?: string;
  parentTournamentName?: string;
  isDirectView: boolean;
  suppressSavePrompt?: boolean;
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
  suppressSavePrompt = false,
}: UseSavedPageParams) => {
  const navigation = useNavigation();
  const globalParams = useGlobalSearchParams();
  const [dismissedPage, setDismissedPage] = useState<string>();
  const [requestedPage, setRequestedPage] = useState<string>();
  const pendingNavigationAction = useRef<NavigationAction | undefined>(undefined);
  const allowNavigation = useRef(false);
  const { savedLinks, isLoading, isError, error, save, remove, touch, isSaving, isRemoving } =
    useSavedLinks();
  const isSaved = useMemo(
    () => Boolean(key && savedLinks.some((link) => link.type === type && link.key === key)),
    [key, savedLinks, type],
  );
  const canSave = Boolean(key && name);
  const pageIdentifier = `${type}:${key ?? ''}`;
  const hasDismissedPrompt = dismissedPage === pageIdentifier;
  const hasRequestedPrompt = requestedPage === pageIdentifier;
  const isPreparingExternalNavigation =
    typeof globalParams[EXTERNAL_ENTRY_PARAM] === 'string';
  const canPromptSave =
    isDirectView &&
    !isPreparingExternalNavigation &&
    !suppressSavePrompt &&
    !isLoading &&
    !isError &&
    !isSaved &&
    canSave;

  useEffect(() => {
    if (!canPromptSave) return;

    return navigation.addListener('beforeRemove', (event) => {
      if (allowNavigation.current) {
        allowNavigation.current = false;
        return;
      }

      event.preventDefault();
      pendingNavigationAction.current = event.data.action;
      setRequestedPage(pageIdentifier);
    });
  }, [canPromptSave, navigation, pageIdentifier]);

  const dismissSavePrompt = useCallback(() => {
    setDismissedPage(pageIdentifier);
    setRequestedPage(undefined);

    const action = pendingNavigationAction.current;
    if (!action) return;

    pendingNavigationAction.current = undefined;
    allowNavigation.current = true;
    navigation.dispatch(action);
  }, [navigation, pageIdentifier]);

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
    shouldPromptSave: canPromptSave && (!hasDismissedPrompt || hasRequestedPrompt),
    dismissSavePrompt,
    hasDismissedPrompt,
    isLoading,
    isError,
    error,
  };
};
