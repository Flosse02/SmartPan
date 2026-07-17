import {Text} from 'react-native';
import {ROUTES} from '../constants/routes';
import {ICONS} from '../constants/icons';

export function getBottomTabsIcon(
  routeName: string,
  focused: boolean,
  color: string,
) {
  const size = 24;
  const {as: HomeIcon, name: homeIcon} = ICONS.HOME;
  const {as: HomeIconOutlined, name: homeIconOutlined} = ICONS.HOME_OUTLINED;
  const {as: RecipeIcon, name: recipeIcon} = ICONS.RECIPES;
  const {as: RecipeIconOutlined, name: recipeIconOutlined} = ICONS.RECIPES_OUTLINED;
  const {as: SettingsIcon, name: settingsIcon} = ICONS.SETTINGS;
  const {as: SettingsIconOutlined, name: settingsIconOutlined} = ICONS.SETTINGS_OUTLINED;
  const {as: HeartIcon, name: heartIcon} = ICONS.HEART;
  const {as: HeartIconOutlined, name: heartIconOutlined} = ICONS.HEART_OUTLINE;
  const {as: CartIcon, name: cartIcon} = ICONS.CART;
  const {as: CartIconOutlined, name: cartIconOutlined} = ICONS.CART_OUTLINE;

  switch (routeName) {
    case ROUTES.HOME:
      return focused ? (
        <HomeIcon name={homeIcon} size={size} color={color} style={{margin: 3}} />
      ) : (
        <HomeIconOutlined name={homeIconOutlined} size={size} color={color} style={{margin: 3}} />
      );
    case ROUTES.RECIPES:
      return focused ? (
        <RecipeIcon name={recipeIcon} size={size} color={color} style={{margin: 3}} />
      ) : (
        <RecipeIconOutlined name={recipeIconOutlined} size={size} color={color} style={{margin: 3}} />
      );
    case ROUTES.FAVOURITES:
      return focused ? (
        <HeartIcon name={heartIcon} size={size} color={color} style={{margin: 3}} />
      ) : (
        <HeartIconOutlined name={heartIconOutlined} size={size} color={color} style={{margin: 3}} />
      );
    case ROUTES.SHOPPING_LIST:
      return focused ? (
        <CartIcon name={cartIcon} size={size} color={color} style={{margin: 3}} />
      ) : (
        <CartIconOutlined name={cartIconOutlined} size={size} color={color} style={{margin: 3}} />
      );
    case ROUTES.SETTINGS:
      return focused ? (
        <SettingsIcon name={settingsIcon} size={size} color={color} style={{margin: 3}} />
      ) : (
        <SettingsIconOutlined name={settingsIconOutlined} size={size} color={color} style={{margin: 3}} />
      );
    default:
      return <Text>{'< Icon >'}</Text>;
  }
}
