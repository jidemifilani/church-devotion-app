import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export type TodayVerseWidgetData = {
  title: string;
  scriptureReference: string;
  scriptureText: string | null;
};

const PRIMARY = '#4A3AFF';

export function TodayVerseWidget({ title, scriptureReference, scriptureText }: TodayVerseWidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FAF9F6',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
      <TextWidget
        text={scriptureReference}
        style={{ fontSize: 13, fontWeight: 'bold', color: PRIMARY }}
        maxLines={1}
      />
      {scriptureText ? (
        <TextWidget
          text={`"${scriptureText}"`}
          style={{ fontSize: 14, fontStyle: 'italic', color: '#1F2233', marginTop: 4 }}
          maxLines={4}
          truncate="END"
        />
      ) : null}
      <TextWidget text={title} style={{ fontSize: 12, color: '#6B7080', marginTop: 8 }} maxLines={1} truncate="END" />
    </FlexWidget>
  );
}
