import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';

type ApiError = {
  body?: {
    errors?: { json?: { message?: string[]; scores?: string[] } };
    message?: string;
  };
  message?: string;
  statusText?: string;
};

export const getMutationErrorMessage = (
  error: unknown,
  fallback: string,
  preferredMessage?: string,
) => {
  if (preferredMessage) return preferredMessage;
  if (!error || typeof error !== 'object') return fallback;

  const apiError = error as ApiError;
  return (
    apiError.body?.errors?.json?.scores?.[0] ??
    apiError.body?.errors?.json?.message?.[0] ??
    apiError.body?.message ??
    apiError.statusText ??
    apiError.message ??
    fallback
  );
};

export const useMutationFeedback = () => {
  const { alertDialog } = useAlertDialog();

  const showSuccess = (message: string, detail?: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      text2: detail,
      position: 'bottom',
    });
  };

  const showError = ({
    title,
    error,
    fallback,
    message,
  }: {
    title: string;
    error?: unknown;
    fallback: string;
    message?: string;
  }) => {
    alertDialog({
      title,
      description: getMutationErrorMessage(error, fallback, message),
      showCancelButton: false,
    });
  };

  return { showError, showSuccess };
};
