import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import MahjongContainer from '@/components/MahjongContainer';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';
import { GroupKeyStorageError, isGroupKeyStorageError } from '@/src/errors/GroupKeyStorageError';
import { useExternalNavigationGuard } from '@/src/hooks/useExternalNavigationGuard';
import { useCreateGroup } from '@/src/hooks/useGroups';
import { appStorage } from '@/src/storage/appStorage';
import {
  completeGroupCreationAttempt,
  getOrStartGroupCreationAttempt,
  isGroupCreationOutcomeUncertain,
} from '@/src/utils/groupCreationAttempt';
import { getGroupCreationStatus } from '@/src/utils/groupSync';

type PageState = 'creating' | 'error';

const GroupCreatePage = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { mutateAsync: createGroupFromToken } = useCreateGroup(undefined, false);
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const invitationToken = Array.isArray(token) ? token[0] : token;
  const [pageState, setPageState] = useState<PageState>('creating');
  useExternalNavigationGuard(pageState === 'creating');
  const [errorMessage, setErrorMessage] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const isSubmitting = useRef(false);
  const isMounted = useRef(true);
  const [pendingGroupKey, setPendingGroupKey] = useState<string | null>(null);
  const [mustCheckStatus, setMustCheckStatus] = useState(false);
  const allowNavigation = useRef(false);

  const recoverUncertainCreation = useCallback(async (): Promise<
    'recovered' | 'retry' | 'invalid'
  > => {
    if (!invitationToken) return 'recovered';

    const status = await getGroupCreationStatus(invitationToken);
    if (status?.status === 'ready' && status.owner_link) {
      try {
        await appStorage.addGroupKey(status.owner_link);
      } catch (cause) {
        throw new GroupKeyStorageError(status.owner_link, cause);
      }
      completeGroupCreationAttempt(invitationToken);
      if (isMounted.current) {
        allowNavigation.current = true;
        router.replace(`/group/${status.owner_link}`);
      }
      return 'recovered';
    }

    if (status?.status === 'pending') {
      completeGroupCreationAttempt(invitationToken);
      return 'retry';
    }

    return 'invalid';
  }, [invitationToken]);

  const createGroup = useCallback(async () => {
    if (isSubmitting.current) return;

    if (!invitationToken) {
      setErrorMessage(t('groupCreatePage.invalidTokenDescription'));
      setCanRetry(false);
      setPageState('error');
      return;
    }

    isSubmitting.current = true;
    setErrorMessage('');
    setCanRetry(false);
    setPendingGroupKey(null);
    setMustCheckStatus(false);
    setPageState('creating');

    try {
      const result = await getOrStartGroupCreationAttempt(invitationToken, () =>
        createGroupFromToken({ token: invitationToken }),
      );
      if (isMounted.current) {
        allowNavigation.current = true;
        router.replace(`/group/${result.owner_link}`);
      }
    } catch (error) {
      if (isMounted.current) {
        if (isGroupKeyStorageError(error)) {
          setPendingGroupKey(error.groupKey);
          setErrorMessage(t('groupCreatePage.groupKeySaveError'));
          setCanRetry(true);
          setPageState('error');
          return;
        }

        if (isGroupCreationOutcomeUncertain(error)) {
          try {
            const outcome = await recoverUncertainCreation();
            if (outcome === 'recovered') return;
            if (outcome === 'invalid') {
              setErrorMessage(t('groupCreatePage.invalidTokenDescription'));
              setCanRetry(false);
              setPageState('error');
              return;
            }
          } catch (recoveryError) {
            if (isGroupKeyStorageError(recoveryError)) {
              setPendingGroupKey(recoveryError.groupKey);
              setErrorMessage(t('groupCreatePage.groupKeySaveError'));
              setCanRetry(true);
              setPageState('error');
              return;
            }
            setMustCheckStatus(true);
          }
        }

        const presentation = getUserFacingApiError(error, {
          messageOverrides: {
            notFound: t('groupCreatePage.invalidTokenDescription'),
            validation: t('groupCreatePage.invalidTokenDescription'),
          },
          unknownMessage: t('groupCreatePage.unknownError'),
        });
        setErrorMessage(presentation.message);
        setCanRetry(presentation.canRetry);
        setPageState('error');
      }
    } finally {
      isSubmitting.current = false;
    }
  }, [createGroupFromToken, invitationToken, recoverUncertainCreation, t]);

  const retryStatusRecovery = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setCanRetry(false);
    setPageState('creating');

    try {
      const outcome = await recoverUncertainCreation();
      if (outcome === 'invalid') {
        setErrorMessage(t('groupCreatePage.invalidTokenDescription'));
        setCanRetry(false);
        setPageState('error');
      } else if (outcome === 'retry') {
        setMustCheckStatus(false);
        isSubmitting.current = false;
        await createGroup();
      }
    } catch (error) {
      if (isMounted.current) {
        if (isGroupKeyStorageError(error)) {
          setPendingGroupKey(error.groupKey);
          setErrorMessage(t('groupCreatePage.groupKeySaveError'));
        } else {
          setErrorMessage(
            getUserFacingApiError(error, {
              unknownMessage: t('groupCreatePage.unknownError'),
            }).message,
          );
        }
        setCanRetry(true);
        setPageState('error');
      }
    } finally {
      isSubmitting.current = false;
    }
  }, [createGroup, recoverUncertainCreation, t]);

  const retryGroupKeyStorage = useCallback(async () => {
    if (!pendingGroupKey || isSubmitting.current) return;

    isSubmitting.current = true;
    setCanRetry(false);
    setPageState('creating');

    try {
      await appStorage.addGroupKey(pendingGroupKey);
      if (invitationToken) completeGroupCreationAttempt(invitationToken);
      if (isMounted.current) {
        allowNavigation.current = true;
        router.replace(`/group/${pendingGroupKey}`);
      }
    } catch {
      if (isMounted.current) {
        setErrorMessage(t('groupCreatePage.groupKeySaveError'));
        setCanRetry(true);
        setPageState('error');
      }
    } finally {
      isSubmitting.current = false;
    }
  }, [invitationToken, pendingGroupKey, t]);

  useEffect(() => {
    void Promise.resolve().then(createGroup);
  }, [createGroup]);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  useEffect(() => {
    if (pageState !== 'creating') return;

    return navigation.addListener('beforeRemove', (event) => {
      if (!allowNavigation.current) {
        event.preventDefault();
      }
    });
  }, [navigation, pageState]);

  if (pageState === 'creating') {
    return (
      <MahjongContainer>
        <View className="flex-1 items-center justify-center gap-4 p-8">
          <ActivityIndicator accessibilityLabel={t('groupCreatePage.creating')} size="large" />
          <Text className="text-center text-lg font-semibold text-on-surface">
            {t('groupCreatePage.creating')}
          </Text>
          <Text className="text-center text-sm text-on-surface-variant">
            {t('groupCreatePage.cannotGoBack')}
          </Text>
        </View>
      </MahjongContainer>
    );
  }

  return (
    <MahjongContainer>
      <View className="flex-1 items-center justify-center gap-5 p-8">
        <Icon as={AlertCircle} className="text-destructive" size={48} />
        <View className="gap-2">
          <Text className="text-center text-xl font-bold text-on-surface">
            {t('groupCreatePage.createErrorTitle')}
          </Text>
          <Text className="text-center text-on-surface-variant">{errorMessage}</Text>
        </View>
        <View className="w-full max-w-sm gap-3">
          <Button
            disabled={!invitationToken || !canRetry}
            onPress={() =>
              void (pendingGroupKey
                ? retryGroupKeyStorage()
                : mustCheckStatus
                  ? retryStatusRecovery()
                  : createGroup())
            }
          >
            <Text>{t('groupCreatePage.retry')}</Text>
          </Button>
          <Button variant="outline" onPress={() => router.replace('/')}>
            <Text>{t('groupCreatePage.backHome')}</Text>
          </Button>
        </View>
      </View>
    </MahjongContainer>
  );
};

export default GroupCreatePage;
