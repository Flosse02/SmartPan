import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    AccessibilityRole 
} from 'react-native';
import { IconType } from '../constants/icons';
import { colours, typography } from '../theme/theme';

type HeaderProps = {
  title: string;
  subtitle?: string;
  connected?: boolean;
  onPress?: () => void;
  buttonIcon?: IconType;
  buttonText?: string;
  buttonAccessibilityLabel?: string;
  buttonAccessibilityRole?: AccessibilityRole;
  loading?: boolean;
};

export function Header({
  title,
  subtitle,
  connected,
  onPress,
  buttonIcon,
  buttonText,
  buttonAccessibilityLabel,
  buttonAccessibilityRole = 'button',
  loading,
}: HeaderProps) {
  const ButtonIcon = buttonIcon?.as;    
  return (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
      </View>

      <View style={s.headerRight}>
        {connected !== undefined && (
          <View style={[s.dot, connected ? s.dotOn : s.dotOff]} />
        )}

        {onPress && (
          <TouchableOpacity
            style={s.actionBtn}
            onPress={onPress}
            disabled={loading}
            accessibilityRole={buttonAccessibilityRole}
            accessibilityLabel={buttonAccessibilityLabel}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <>
                {ButtonIcon && buttonIcon && (
                  <ButtonIcon name={buttonIcon.name} size={18} color="#6366f1" />
                )}
                {buttonText ? <Text style={s.actionBtnText}>{buttonText}</Text> : null}
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  headerLeft:           { flexShrink: 1 },
  headerTitle:          { fontSize: typography.title.fontSize, fontWeight: typography.title.fontWeight, color: colours.text, letterSpacing: -0.5 },
  headerSub:            { fontSize: typography.subtitle.fontSize, color: colours.textGhost, marginTop: 2 },
  headerRight:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:                  { width: 7, height: 7, borderRadius: 4 },
  dotOn:                { backgroundColor: colours.accent },
  dotOff:               { backgroundColor: colours.textGhost },
  actionBtn:              { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colours.surface, borderRadius: 8, borderWidth: 0.5, borderColor: colours.border, paddingHorizontal: 10, paddingVertical: 7 },
  actionBtnText:         { color: colours.accent, fontSize: typography.small.fontSize, fontWeight: typography.small.fontWeight },
});