import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { ICONS } from '../constants/icons';
import { useTheme } from '../theme/Themecontext';
import { typography } from '../theme/theme';


type searchBarProps = {
  placeholder: string;
  query: string;
  setQuery: (query: string) => void;
  handleSearch?: () => void;
};

export function SearchBar({
  placeholder,
  query,
  setQuery,
  handleSearch,
}: searchBarProps) {
  const { colours } = useTheme();
  const {as: SearchIcon, name: searchIcon} = ICONS.SEARCH;
  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;
  return (
    <View style={s(colours).searchWrap}>
        <Text style={s(colours).searchIcon}><SearchIcon name={searchIcon} size={24} color={colours.textFaint} /></Text>
        <TextInput
            style={s(colours).searchInput}
            placeholder={placeholder}
            placeholderTextColor={colours.textFaint}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
        />
        {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={s(colours).searchClear}><CloseIcon name={closeIcon} size={24} color={colours.textFaint} /></Text>
            </TouchableOpacity>
        )}
    </View>
  )
}

const s = (colours: ReturnType<typeof useTheme>['colours']) => StyleSheet.create({
    searchWrap:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, backgroundColor: colours.surface, borderRadius: 10, borderWidth: 0.5, borderColor: colours.border, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    searchIcon:           { fontSize: 14 },
    searchInput:          { flex: 1, fontSize: typography.body.fontSize, color: colours.text },
    searchClear:          { fontSize: 14, color: colours.textFaint, paddingLeft: 8 },
});