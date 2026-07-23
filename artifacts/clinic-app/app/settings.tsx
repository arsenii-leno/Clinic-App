import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// ─── Small reusable components ────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

function SettingRow({
  icon,
  label,
  value,
  badge,
  onPress,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  const Wrapper = onPress && !disabled ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.rowLabel,
          { color: disabled ? colors.mutedForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.badgeText, { color: '#92400E' }]}>{badge}</Text>
          </View>
        ) : null}
        {value ? (
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {onPress && !disabled ? (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        ) : null}
      </View>
    </Wrapper>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={[styles.section, { borderColor: colors.border, borderTopColor: colors.border }]}
    >
      {children}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colors = useColors();

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Google Sheets ── */}
      <SectionHeader label="SYNC & INTEGRATIONS" />
      <Section>
        <SettingRow
          icon="logo-google"
          label="Google Sheets"
          badge="Phase 2"
          disabled
        />
        <SettingRow
          icon="grid-outline"
          label="Spreadsheet ID"
          value="Not configured"
          disabled
        />
        <SettingRow
          icon="key-outline"
          label="API Key / Credentials"
          value="Not configured"
          disabled
        />
      </Section>

      {/* ── Telegram ── */}
      <SectionHeader label="NOTIFICATIONS" />
      <Section>
        <SettingRow
          icon="paper-plane-outline"
          label="Telegram Bot"
          badge="Coming soon"
          disabled
        />
        <SettingRow
          icon="notifications-outline"
          label="Appointment Reminders"
          badge="Coming soon"
          disabled
        />
      </Section>

      {/* ── About ── */}
      <SectionHeader label="ABOUT" />
      <Section>
        <SettingRow icon="phone-portrait-outline" label="App Version" value="1.0.0" />
        <SettingRow icon="person-outline" label="Built for" value="Clinic Reception" />
        <SettingRow icon="save-outline" label="Data Storage" value="Local (device only)" />
      </Section>

      {/* Phase 2 info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
          <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Phase 2 </Text>
          will add Google Sheets sync so all appointments are saved to a shared spreadsheet — no
          extra setup needed for the clinic.
        </Text>
      </View>
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
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '45%',
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});
