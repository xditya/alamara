/** Single source of truth for the bottom tabs — imported by BOTH app-tabs.tsx and app-tabs.web.tsx. */

import type { IconName } from '@/components/ui/icon';

export interface TabDescriptor {
  /** expo-router route segment name under (tabs). */
  name: string;
  title: string;
  /** Route path (cast to Href at the call site; typed routes regenerate on dev-server start). */
  href: string;
  /** SF Symbol used by native tabs on iOS. */
  sfSymbol: string;
  /** Icon key for the web/JS tab bar (see components/ui/icon.tsx). */
  icon: IconName;
}

export const TABS: TabDescriptor[] = [
  { name: 'index', title: 'Home', href: '/', sfSymbol: 'house.fill', icon: 'home' },
  { name: 'documents', title: 'Documents', href: '/documents', sfSymbol: 'folder.fill', icon: 'folder' },
  { name: 'wallet', title: 'Wallet', href: '/wallet', sfSymbol: 'wallet.pass.fill', icon: 'wallet' },
  { name: 'settings', title: 'Settings', href: '/settings', sfSymbol: 'gearshape.fill', icon: 'settings' },
];
