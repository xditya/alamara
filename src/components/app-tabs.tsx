import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { TABS } from '@/constants/tabs';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
          {/* iOS renders the SF Symbol; other platforms fall back to a template image.
              TODO(device phase): supply per-tab Android drawables instead of the placeholder. */}
          <NativeTabs.Trigger.Icon
            sf={tab.sfSymbol as never}
            src={require('@/assets/images/tabIcons/home.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
