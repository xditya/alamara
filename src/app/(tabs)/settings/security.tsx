import { useState } from 'react';
import { View } from 'react-native';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { SwitchRow } from '@/components/settings/switch-row';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Spacing } from '@/constants/theme';

// TODO(device): back these with expo-local-authentication (biometric prompt) and
// expo-secure-store (persisted lock preferences). State is in-memory for now.

const TIMEOUTS = [
  { value: 'immediately', label: 'Immediately' },
  { value: '1min', label: 'After 1 minute' },
  { value: '5min', label: 'After 5 minutes' },
] as const;

type Timeout = (typeof TIMEOUTS)[number]['value'];

export default function SecuritySettings() {
  const toast = useToast();
  const [appLock, setAppLock] = useState(true);
  const [blur, setBlur] = useState(true);
  const [timeout, setTimeoutValue] = useState<Timeout>('1min');

  return (
    <SettingsScreen title="Security" back>
      <SettingGroup
        title="App lock"
        footer="Require Face ID, Touch ID, or your device passcode to open Alamara."
        index={0}
      >
        <SwitchRow
          icon="lock"
          label="Biometric app lock"
          subtitle="Unlock with Face ID / Touch ID"
          value={appLock}
          onValueChange={setAppLock}
        />
      </SettingGroup>

      <SettingGroup
        title="Auto-lock"
        footer="How soon Alamara re-locks after you leave the app."
        index={1}
      >
        {TIMEOUTS.map((t) => (
          <SettingRow
            key={t.value}
            label={t.label}
            selected={timeout === t.value}
            onPress={() => setTimeoutValue(t.value)}
          />
        ))}
      </SettingGroup>

      <SettingGroup title="Privacy" index={2}>
        <SwitchRow
          icon="eye"
          label="Blur app in app-switcher"
          subtitle="Hide contents in the multitasking preview"
          value={blur}
          onValueChange={setBlur}
        />
      </SettingGroup>

      <View style={{ marginTop: Spacing.xs }}>
        <Button
          title="Re-authenticate now"
          icon="shield"
          variant="secondary"
          onPress={() => toast.show('Identity confirmed')}
        />
      </View>
    </SettingsScreen>
  );
}
