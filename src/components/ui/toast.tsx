import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ToastItem = { id: number; message: string };

const ToastCtx = createContext<{ show: (message: string) => void }>({ show: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <ToastHost toasts={toasts} />
    </ToastCtx.Provider>
  );
}

function ToastHost({ toasts }: { toasts: ToastItem[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 96 }]}>
      {toasts.map((t) => (
        <Animated.View
          key={t.id}
          entering={FadeInDown.springify().damping(26)}
          exiting={FadeOutDown.duration(180)}
          style={[styles.toast, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
        >
          <AppText variant="body" style={{ color: theme.text }}>
            {t.message}
          </AppText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: Spacing.sm },
  toast: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxWidth: '90%',
  },
});
