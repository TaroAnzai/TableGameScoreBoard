// src/components/common/AlertDialogProvider.tsx

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';

type AlertDialogOptions = {
  title?: string;
  description?: string;
  text1?: string;
  text2?: string;
  text3?: string;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
};

type AlertDialogContextType = {
  alertDialog: (options: AlertDialogOptions) => Promise<boolean>;
};

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export const AlertDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertDialogOptions>({});
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const resolveDialog = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    if (!resolve) return;

    resolverRef.current = null;
    setIsOpen(false);
    resolve(result);
  }, []);

  const alertDialog = useCallback((opts: AlertDialogOptions) => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    resolveDialog(true);
  };

  const handleCancel = () => {
    resolveDialog(false);
  };

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen);
      if (nextOpen) return;

      // The primitive closes before its action/cancel onPress handler runs. Defer the
      // fallback so button handlers can resolve with their explicit result first.
      void Promise.resolve().then(() => resolveDialog(false));
    },
    [resolveDialog],
  );
  const contextValue = useMemo(() => ({ alertDialog }), [alertDialog]);

  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title ?? t('Common.Confirm')}</AlertDialogTitle>

            <AlertDialogDescription>
              {[options.description, options.text1, options.text2, options.text3]
                .filter(Boolean)
                .join('\n')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {options.showCancelButton !== false && (
              <AlertDialogCancel onPress={handleCancel}>
                <Text>{options.cancelText ?? t('Common.Cancel')}</Text>
              </AlertDialogCancel>
            )}

            <AlertDialogAction onPress={handleConfirm}>
              <Text>{options.confirmText ?? t('Common.ok')}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext.Provider>
  );
};

export const useAlertDialog = () => {
  const ctx = useContext(AlertDialogContext);

  if (!ctx) {
    throw new Error('useAlertDialog must be used within AlertDialogProvider');
  }

  return ctx;
};
