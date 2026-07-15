import { useRef, useState, type ElementRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

type Props = {
  title: string;
  scriptureReference: string;
  scriptureText: string | null | undefined;
};

export function ShareVerseButton({ title, scriptureReference, scriptureText }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shotRef = useRef<ElementRef<typeof ViewShot>>(null);

  const share = async () => {
    setSharing(true);
    try {
      const uri = await shotRef.current?.capture?.();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={12}>
        <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }}>
            <View style={styles.card}>
              <Text style={styles.cardRef}>{scriptureReference}</Text>
              {scriptureText ? <Text style={styles.cardText}>"{scriptureText}"</Text> : null}
              <Text style={styles.cardTitle}>{title}</Text>
            </View>
          </ViewShot>
          <View style={styles.actions}>
            <Pressable onPress={() => setOpen(false)} style={styles.actionButton}>
              <Text style={styles.actionText}>Close</Text>
            </Pressable>
            <Pressable onPress={share} style={[styles.actionButton, styles.shareAction]} disabled={sharing}>
              <Text style={styles.shareText}>{sharing ? 'Preparing…' : 'Share'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    card: {
      width: 320,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    cardRef: { fontSize: 14, fontWeight: '700', color: '#fff', opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 },
    cardText: { fontSize: 22, fontStyle: 'italic', color: '#fff', lineHeight: 30 },
    cardTitle: { fontSize: 14, color: '#fff', opacity: 0.85, marginTop: theme.spacing.md },
    actions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
    actionButton: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.pill },
    actionText: { color: '#fff', fontWeight: '600' },
    shareAction: { backgroundColor: theme.colors.primary },
    shareText: { color: '#fff', fontWeight: '700' },
  });
