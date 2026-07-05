import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { IconType } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';
import { typography } from '../theme/theme';
import { ICONS } from '../constants/icons';

type InputBarProps = {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  icon?: IconType;
  clearable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  returnKeyType?: 'search' | 'done' | 'go' | 'next' | 'send';
  maxLength?: number;
};

export function InputBar({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  icon,
  clearable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  returnKeyType = 'done',
  maxLength,
}: InputBarProps) {
  const { colours } = useTheme();
  const styles = s(colours);
  const Icon = icon?.as;
  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;

  return (
    <View style={styles.wrap}>
      {Icon && icon && (
        <Text style={styles.icon}><Icon name={icon.name} size={20} color={colours.textFaint} /></Text>
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colours.textFaint}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType={returnKeyType}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
      />
      {clearable && value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Text style={styles.clear}><CloseIcon name={closeIcon} size={24} color={colours.textFaint} /></Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, backgroundColor: colours.surface, borderRadius: 10, borderWidth: 0.5, borderColor: colours.border, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  icon:   { fontSize: 14 },
  input:  { flex: 1, fontSize: typography.body.fontSize, color: colours.text },
  clear:  { fontSize: 14, color: colours.textFaint, paddingLeft: 8 },
});