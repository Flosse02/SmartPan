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
import { typography } from '../theme/theme';
import { useTheme } from '../theme/Themecontext';

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
  const { colours } = useTheme();
  return (
    <View style={s(colours).header}>
      <View style={s(colours).headerLeft}>
        <View style={s(colours).devHeader}>
          <Text style={s(colours).headerTitle} numberOfLines={1}>{title}</Text>
          {__DEV__ && <Text style={s(colours).devBadge}>DEV MODE</Text>}
        </View>
        {subtitle ? <Text style={s(colours).headerSub}>{subtitle}</Text> : null}
      </View>

      <View style={s(colours).headerRight}>

        {connected !== undefined && (
          <View style={[s(colours).dot, connected ? s(colours).dotOn : s(colours).dotOff]} />
        )}

        {onPress && (
          <TouchableOpacity
            style={s(colours).actionBtn}
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
                {buttonText ? <Text style={s(colours).actionBtnText}>{buttonText}</Text> : null}
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  headerLeft:           { flexShrink: 1 },
  devHeader:            { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:          { flexShrink: 1, fontSize: typography.title.fontSize, fontWeight: typography.title.fontWeight, color: colours.text, letterSpacing: -0.5 },
  headerSub:            { fontSize: typography.subtitle.fontSize, color: colours.textGhost, marginTop: 2 },
  headerRight:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  devBadge:             { flexShrink: 0, color: colours.error, fontSize: 10, fontWeight: '700', letterSpacing: 0.5},
  dot:                  { width: 7, height: 7, borderRadius: 4 },
  dotOn:                { backgroundColor: colours.accent },
  dotOff:               { backgroundColor: colours.textGhost },
  actionBtn:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colours.surface, borderRadius: 8, borderWidth: 0.5, borderColor: colours.border, paddingHorizontal: 10, paddingVertical: 7 },
  actionBtnText:        { color: colours.accent, fontSize: typography.small.fontSize, fontWeight: typography.small.fontWeight },
});