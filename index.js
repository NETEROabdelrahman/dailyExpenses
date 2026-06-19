/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

if (appName !== 'DailyExpenses') {
  AppRegistry.registerComponent('DailyExpenses', () => App);
}
