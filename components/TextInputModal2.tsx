import type { ComponentProps } from 'react';

import { TextInputModal } from '@/components/TextInputModal';

type TextInputModal2Props = ComponentProps<typeof TextInputModal>;

/**
 * Backward-compatible alias for the legacy glass-style modal.
 * New rendering is delegated to the design-system Dialog implementation.
 */
export const TextInputModal2 = (props: TextInputModal2Props) => {
  return <TextInputModal {...props} />;
};
