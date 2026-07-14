import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

type Props = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
};

export function DatePickerField({ label, value, onChange }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [showPicker, setShowPicker] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : new Date();

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) {
      onChange(selected.toISOString().slice(0, 10));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={theme.typography.caption}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={theme.typography.body}>{value || 'Select date'}</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleChange} />
      ) : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.xs },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      backgroundColor: theme.colors.surface,
    },
  });
