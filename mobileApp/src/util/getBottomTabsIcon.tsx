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
    default:
      return <Text>{'< Icon >'}</Text>;
  }
}
