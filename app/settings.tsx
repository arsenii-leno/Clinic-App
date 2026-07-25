import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type IconName = keyof typeof Ionicons.glyphMap;

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{label}</Text>;
}

function SettingRow({
  icon,
  label,
  value,
  badge,
}: {
  icon: IconName;
  label: string;
  value?: string;
  badge?: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
        </View>
      ) : null}
      {value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : null}
    </View>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <View style={[styles.section, { borderColor: colors.border }]}>{children}</View>;
}

export default function SettingsScreen() {
  const colors = useColors();
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader label="DATA" />
      <Section>
        <SettingRow icon="phone-portrait-outline" label="Storage" value="This device only" />
        <SettingRow icon="shield-checkmark-outline" label="Credentials" value="Not stored in app" />
      </Section>

      <SectionHeader label="INTEGRATIONS" />
      <Section>
        <SettingRow icon="logo-google" label="Google Sheets" badge="Backend required" />
        <SettingRow icon="paper-plane-outline" label="Telegram Bot" badge="Backend required" />
        <SettingRow
          icon="notifications-outline"
          label="Appointment Reminders"
          badge="Backend required"
        />
      </Section>

      <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
          Integrations must be configured through an authenticated backend. Never paste
          service-account JSON or bot tokens into a mobile app.
        </Text>
      </View>

      <SectionHeader label="ABOUT" />
      <Section>
        <SettingRow icon="information-circle-outline" label="App Version" value="1.0.0" />
        <SettingRow icon="person-outline" label="Built for" value="Clinic Reception" />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 60 },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 28,
    padding: 16,
    borderRadius: 14,
  },
  infoText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
