'use client';

import { RoundsClient, type RoundsClientProps } from '../rounds/RoundsClient';

/**
 * Wrapper pour RoundsClient en mode onglet integre
 * Reutilise RoundsClient avec embedded=true pour eviter la duplication de code
 */
export type RoundsTabProps = Omit<RoundsClientProps, 'embedded'>;

export function RoundsTab(props: RoundsTabProps) {
  return <RoundsClient {...props} embedded />;
}
