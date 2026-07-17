import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/Themecontext';
import { registerAlertListener, AlertRequest, AlertButton } from './alertStore';

/**
 * Renders whatever alert() (alertStore.ts) is asked to show, themed with
 * this app's own colours instead of the OS's native dialog. Mount exactly
 * once, near the app root inside ThemeProvider — see App.tsx.
 */
export function AlertHost() {
  const { colours } = useTheme();
  const s = createStyles(colours);
  const [request, setRequest] = useState<AlertRequest | null>(null);

  useEffect(() => {
    registerAlertListener(setRequest);
    return () => registerAlertListener(null);
  }, []);

  const handlePress = (button: AlertButton) => {
    setRequest(null);
    button.onPress?.();
  };

  return (
    <Modal
      visible={!!request}
      transparent
      animationType="fade"
      onRequestClose={() => request && handlePress(request.buttons[request.buttons.length - 1])}
    >
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.title}>{request?.title}</Text>
          {request?.message ? <Text style={s.message}>{request.message}</Text> : null}
          <View style={s.actions}>
            {request?.buttons.map((button, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.btn,
                  button.style === 'cancel' && s.btnCancel,
                  button.style === 'destructive' && s.btnDestructive,
                ]}
                onPress={() => handlePress(button)}
              >
                <Text
                  style={[
                    s.btnText,
                    button.style === 'cancel' && s.btnTextCancel,
                    button.style === 'destructive' && s.btnTextDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  backdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:             { width: '100%', maxWidth: 340, backgroundColor: colours.surface, borderRadius: 14, padding: 20, gap: 8 },
  title:            { fontSize: 16, fontWeight: '600', color: colours.text, textAlign: 'center' },
  message:          { fontSize: 13, color: colours.textGhost, textAlign: 'center', lineHeight: 19, marginTop: 2 },
  actions:          { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn:              { flex: 1, backgroundColor: colours.accent, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  btnCancel:        { backgroundColor: colours.bg, borderWidth: 0.5, borderColor: colours.border },
  btnDestructive:   { backgroundColor: colours.error },
  btnText:          { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnTextCancel:    { color: colours.textGhost },
  btnTextDestructive: { color: '#fff' },
});
