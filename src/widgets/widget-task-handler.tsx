import React from 'react';
import type { WidgetTaskHandler } from 'react-native-android-widget';
import { TodayVerseWidget } from './TodayVerseWidget';
import { readTodayVerseWidgetData } from './widgetStorage';

const nameToWidget = {
  TodayVerse: TodayVerseWidget,
};

export const widgetTaskHandler: WidgetTaskHandler = async (props) => {
  const Widget = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];
  if (!Widget) return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await readTodayVerseWidgetData();
      props.renderWidget(
        <Widget
          title={data?.title ?? 'Church Devotion'}
          scriptureReference={data?.scriptureReference ?? ''}
          scriptureText={data?.scriptureText ?? "Open the app to read today's devotion."}
        />
      );
      break;
    }
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
      break;
    default:
      break;
  }
};
