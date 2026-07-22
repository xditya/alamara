import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { SwitchRow } from '@/components/settings/switch-row';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Spacing } from '@/constants/theme';
import { session } from '@/lib/session';
import { setBiometricLock, usePreferences } from '@/lib/theme-store';
import * as biometric from '@/services/biometric';

export default function SecuritySettings() {
  const toast = useToast();
  const { biometricLock } = usePreferences();
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    biometric.isAvailable().then(setAvailable);
  }, []);

  const onToggleLock = async (value: boolean) => {
    if (value) {
      // Confirm the user can actually authenticate before turning the lock on.
      const ok = await biometric.authenticate();
      if (!ok) {
        toast.show('Could not verify — lock not enabled');
        return;
      }
      session.unlocked = true; // already inside the app this session
    }
    setBiometricLock(value);
    toast.show(value ? 'App lock enabled' : 'App lock disabled');
  };

  const reauth = async () => {
    const ok = await biometric.authenticate();
    toast.show(ok ? 'Identity confirmed' : 'Authentication failed');
  };

  return (
    <SettingsScreen title="Security" back>
      <SettingGroup
        title="App lock"
        footer={
          available
            ? 'Require Face ID, fingerprint, or your device passcode to open Alamara.'
            : 'Set up a screen lock or biometrics in your device settings to enable this.'
        }
        index={0}
      >
        <SwitchRow
          icon="lock"
          label="Biometric app lock"
          subtitle="Unlock with biometrics on launch"
          value={biometricLock}
          onValueChange={onToggleLock}
        />
      </SettingGroup>

      <View style={{ marginTop: Spacing.xs }}>
        <Button title="Re-authenticate now" icon="shield" variant="secondary" onPress={reauth} />
      </View>
    </SettingsScreen>
  );
}
