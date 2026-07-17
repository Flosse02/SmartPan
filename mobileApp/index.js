/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import App from './App';
import { name as appName } from './app.json';
import { shoppingListWidgetTaskHandler } from './src/widgets/shoppingListWidgetTask';

AppRegistry.registerComponent(appName, () => App);
registerWidgetTaskHandler(shoppingListWidgetTaskHandler);
