import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';

export const getMutationErrorMessage = (
  error: unknown,
  fallback: string,
  preferredMessage?: string,
) => {
  if (preferredMessage) return preferredMessage;
  return getUserFacingApiError(error, { unknownMessage: fallback }).message;
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
