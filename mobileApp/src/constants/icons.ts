import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Foundation from 'react-native-vector-icons/Foundation';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
export const HOME = {as: AntDesign, name: 'android1'};

export type IconType = {
  name: string;
  as:
    | typeof AntDesign
    | typeof SimpleLineIcons
    | typeof MaterialCommunityIcons
    | typeof MaterialIcons
    | typeof Ionicons
    | typeof FontAwesome5
    | typeof Foundation;
};

export const ICONS = {
  HOME_OUTLINED: {as: MaterialCommunityIcons , name: 'home-outline'},
  HOME: {as: MaterialCommunityIcons , name: 'home'},
  RECIPES_OUTLINED: {as: MaterialCommunityIcons , name: 'book-open-outline'},
  RECIPES: {as: MaterialCommunityIcons , name: 'book-open'},
} as const;

export type IconConstType = typeof ICONS;
export type IconName = keyof IconConstType;
export type IconAttributes = IconConstType[keyof IconConstType];