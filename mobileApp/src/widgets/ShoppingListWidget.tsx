import React from 'react';
import { FlexWidget, TextWidget, ListWidget, ColorProp } from 'react-native-android-widget';
import { ShoppingListItem } from '../shoppingList';
import { Colours } from '../theme/theme';
import { formatFraction } from '../util/cleanIngridents';

// Colours' fields are plain `string` (hex values at runtime), but the widget
// library's style props want the stricter `#hex` / `rgba()` literal type.
// One cast here instead of scattering `as any` through every style prop below.
type WidgetColours = { [K in keyof Colours]: ColorProp };

function fmtAmount(item: ShoppingListItem) {
  return [item.amount != null ? formatFraction(Number(item.amount.toFixed(3))) : null, item.unit]
    .filter(Boolean)
    .join(' ');
}

type ShoppingListWidgetProps = {
  items: ShoppingListItem[];
  colours: Colours;
};

/**
 * Home-screen widget for the shopping list. Only shows unchecked items —
 * a widget is a glance-and-go surface, checked-off items belong in the app.
 * Tapping an item toggles it (handled in shoppingListWidgetTask.ts); tapping
 * anywhere else opens the app to the Shopping List tab.
 */
export function ShoppingListWidget({ items, colours: rawColours }: ShoppingListWidgetProps) {
  const colours = rawColours as unknown as WidgetColours;
  const unchecked = items.filter(i => !i.checked);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: colours.bg,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <TextWidget text="Shopping List" style={{ fontSize: 14, fontWeight: 'bold', color: colours.text }} />
        {unchecked.length > 0 && (
          <TextWidget text={String(unchecked.length)} style={{ fontSize: 12, color: colours.textGhost }} />
        )}
      </FlexWidget>

      {unchecked.length === 0 ? (
        <FlexWidget style={{ width: 'match_parent', height: 'match_parent', alignItems: 'center', justifyContent: 'center' }}>
          <TextWidget text="All done" style={{ fontSize: 12, color: colours.textGhost }} />
        </FlexWidget>
      ) : (
        <ListWidget style={{ width: 'match_parent', height: 'match_parent' }}>
          {unchecked.map(item => (
            <FlexWidget
              key={item.id}
              clickAction="TOGGLE_ITEM"
              clickActionData={{ id: item.id }}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
              }}
            >
              <FlexWidget
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: colours.border,
                  backgroundColor: colours.surface,
                  marginRight: 8,
                }}
              />
              <TextWidget
                text={[fmtAmount(item), item.name].filter(Boolean).join(' ')}
                style={{ fontSize: 12, color: colours.text }}
                maxLines={1}
                truncate="END"
              />
            </FlexWidget>
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
