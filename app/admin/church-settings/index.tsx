import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAdminForm } from '@/hooks/useAdminForm';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { StaffMembersEditor } from '@/components/StaffMembersEditor';
import type { Theme } from '@/constants/theme';

export default function AdminChurchSettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const churchInfo = useAdminForm(
    'church_info',
    '1',
    { id: 1, name: '' },
    {
      validate: (v) => (!v.name?.trim() ? 'Church name is required.' : null),
      beforeSave: (v) => {
        const address = v.address?.trim();
        const serviceTimes = v.service_times?.trim();
        const phone = v.phone?.trim();
        const email = v.email?.trim();
        const website = v.website?.trim();
        const mapUrl = v.map_url?.trim();
        return {
          ...v,
          name: v.name?.trim(),
          address: address ? address : null,
          service_times: serviceTimes ? serviceTimes : null,
          phone: phone ? phone : null,
          email: email ? email : null,
          website: website ? website : null,
          map_url: mapUrl ? mapUrl : null,
        };
      },
    }
  );

  const givingSettings = useAdminForm('giving_settings', '1', { id: 1 }, {
    beforeSave: (v) => {
      const givingUrl = v.giving_url?.trim();
      const note = v.note?.trim();
      return {
        ...v,
        giving_url: givingUrl ? givingUrl : null,
        note: note ? note : null,
      };
    },
  });

  const saveChurchInfo = async () => {
    const { error } = await churchInfo.save();
    if (error) Alert.alert('Could not save', error);
    else Alert.alert('Saved', 'Church info updated.');
  };

  const saveGivingSettings = async () => {
    const { error } = await givingSettings.save();
    if (error) Alert.alert('Could not save', error);
    else Alert.alert('Saved', 'Giving settings updated.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={theme.typography.heading}>Church Info</Text>
        <TextField
          label="Name"
          value={churchInfo.values.name ?? ''}
          onChangeText={(text) => churchInfo.setValue('name', text)}
          placeholder="Grace Community Church"
        />
        <TextField
          label="Address (optional)"
          value={churchInfo.values.address ?? ''}
          onChangeText={(text) => churchInfo.setValue('address', text)}
          placeholder="123 Main St, Anytown, USA"
        />
        <TextField
          label="Service times (optional)"
          value={churchInfo.values.service_times ?? ''}
          onChangeText={(text) => churchInfo.setValue('service_times', text)}
          placeholder="Sundays 9am & 11am"
          multiline
          style={styles.multiline}
        />
        <TextField
          label="Phone (optional)"
          value={churchInfo.values.phone ?? ''}
          onChangeText={(text) => churchInfo.setValue('phone', text)}
          placeholder="(555) 555-5555"
          keyboardType="phone-pad"
        />
        <TextField
          label="Email (optional)"
          value={churchInfo.values.email ?? ''}
          onChangeText={(text) => churchInfo.setValue('email', text)}
          placeholder="info@example.com"
          autoCapitalize="none"
        />
        <TextField
          label="Website (optional)"
          value={churchInfo.values.website ?? ''}
          onChangeText={(text) => churchInfo.setValue('website', text)}
          placeholder="https://example.com"
          autoCapitalize="none"
        />
        <TextField
          label="Map URL (optional)"
          value={churchInfo.values.map_url ?? ''}
          onChangeText={(text) => churchInfo.setValue('map_url', text)}
          placeholder="https://maps.google.com/..."
          autoCapitalize="none"
        />
        <Text style={theme.typography.caption}>
          Optional — a Google Maps link. Falls back to searching the address if left blank.
        </Text>
        <Button label="Save church info" onPress={saveChurchInfo} loading={churchInfo.saving} />
      </View>

      <View style={styles.section}>
        <Text style={theme.typography.heading}>Giving Settings</Text>
        <TextField
          label="Giving page URL"
          value={givingSettings.values.giving_url ?? ''}
          onChangeText={(text) => givingSettings.setValue('giving_url', text)}
          placeholder="https://give.example.com"
          autoCapitalize="none"
        />
        <TextField
          label="Message shown above the Give button"
          value={givingSettings.values.note ?? ''}
          onChangeText={(text) => givingSettings.setValue('note', text)}
          placeholder="Thank you for considering a gift to support our ministry."
          multiline
          style={styles.multiline}
        />
        <Button label="Save giving settings" onPress={saveGivingSettings} loading={givingSettings.saving} />
      </View>

      <View style={styles.section}>
        <StaffMembersEditor />
      </View>
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: theme.spacing.xl, backgroundColor: theme.colors.background, flexGrow: 1 },
    section: { gap: theme.spacing.md },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
  });
