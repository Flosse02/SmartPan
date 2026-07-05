import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { ICONS } from '../constants/icons';

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
  const {as: SearchIcon, name: searchIcon} = ICONS.SEARCH;
  const {as: CloseIcon, name: closeIcon} = ICONS.CLOSE;
  return (
    <View style={s.searchWrap}>
        <Text style={s.searchIcon}><SearchIcon name={searchIcon} size={24} color={"#444"} /></Text>
        <TextInput
            style={s.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#444"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
        />
        {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={s.searchClear}><CloseIcon name={closeIcon} size={24} color={"#444"} /></Text>
            </TouchableOpacity>
        )}
    </View>
  )
}

const s = StyleSheet.create({
    searchWrap:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, backgroundColor: '#1a1a1f', borderRadius: 10, borderWidth: 0.5, borderColor: '#2a2a2f', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    searchIcon:           { fontSize: 14 },
    searchInput:          { flex: 1, fontSize: 14, color: '#f0f0f0' },
    searchClear:          { fontSize: 14, color: '#666', paddingLeft: 8 },
});