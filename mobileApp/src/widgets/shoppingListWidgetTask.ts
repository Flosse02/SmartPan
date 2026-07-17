import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { shoppingList } from '../shoppingList';
import { SHOPPING_LIST_WIDGET_NAME, buildShoppingListWidgetElement } from './shoppingListWidgetSync';

export { SHOPPING_LIST_WIDGET_NAME };

async function renderCurrentState(renderWidget: WidgetTaskHandlerProps['renderWidget']) {
  const items = await shoppingList.getAll();
  renderWidget(await buildShoppingListWidgetElement(items));
}

export async function shoppingListWidgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderCurrentState(props.renderWidget);
      break;

    case 'WIDGET_CLICK':
      if (props.clickAction === 'TOGGLE_ITEM') {
        const id = props.clickActionData?.id;
        if (typeof id === 'string') await shoppingList.toggleChecked(id, { skipWidgetSync: true });
      }
      await renderCurrentState(props.renderWidget);
      break;

    case 'WIDGET_DELETED':
      break;
  }
}
