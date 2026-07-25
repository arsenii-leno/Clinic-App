import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as GoogleSheetsRepo from '@/repository/GoogleSheetsRepository';

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
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [connectionState, setConnectionState] = useState<'idle' | 'connected' | 'disconnected' | 'testing' | 'syncing'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [storageType, setStorageType] = useState<'Local' | 'Google Sheets'>('Local');
  const [statusText, setStatusText] = useState('Not configured');

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const settings = await GoogleSheetsRepo.getSettings();
      if (!mounted) return;
      if (settings?.enabled) {
        setSpreadsheetId(settings.spreadsheetId || '');
        setServiceAccountJson(settings.serviceAccountJson || '');
        setConnectionState('connected');
        setStorageType('Google Sheets');
        setStatusText('Connected');
      } else {
        setConnectionState('disconnected');
        setStatusText('Not connected');
      }
      const syncAt = await GoogleSheetsRepo.getLastSync();
      if (mounted) setLastSync(syncAt);
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const connectionBadge = useMemo(() => {
    if (connectionState === 'connected') return 'Connected';
    if (connectionState === 'testing') return 'Testing';
    if (connectionState === 'syncing') return 'Syncing';
    return 'Disconnected';
  }, [connectionState]);

  async function handleConnect() {
    if (!spreadsheetId.trim() || !serviceAccountJson.trim()) {
      Alert.alert('Missing configuration', 'Please enter both the spreadsheet ID and service account JSON.');
      return;
    }

    setConnectionState('testing');
    setStatusText('Testing connection…');
    const ok = await GoogleSheetsRepo.connect(spreadsheetId.trim(), serviceAccountJson.trim());
    if (ok) {
      setConnectionState('connected');
      setStorageType('Google Sheets');
      setStatusText('Connected');
      const syncAt = await GoogleSheetsRepo.getLastSync();
      setLastSync(syncAt);
      Alert.alert('Connected', 'Google Sheets is now connected.');
    } else {
      setConnectionState('disconnected');
      setStorageType('Local');
      setStatusText('Connection failed');
      Alert.alert('Connection failed', 'Please verify the spreadsheet ID and service account JSON.');
    }
  }

  async function handleDisconnect() {
    setConnectionState('disconnected');
    setStorageType('Local');
    setStatusText('Disconnected');
    await GoogleSheetsRepo.disconnect();
    setLastSync(null);
  }

  async function handleTestConnection() {
    if (!spreadsheetId.trim() || !serviceAccountJson.trim()) {
      Alert.alert('Missing configuration', 'Please enter both the spreadsheet ID and service account JSON.');
      return;
    }

    setConnectionState('testing');
    setStatusText('Testing connection…');
    const result = await GoogleSheetsRepo.testConnection(spreadsheetId.trim(), serviceAccountJson.trim());
    if (result.ok) {
      setConnectionState('connected');
      setStatusText('Connected');
      Alert.alert('Connection successful', result.title ? `Connected to ${result.title}` : 'Connection successful.');
    } else {
      setConnectionState('disconnected');
      setStatusText('Connection failed');
      Alert.alert('Connection failed', result.error || 'Unable to connect.');
    }
  }

  async function handleSyncNow() {
    setConnectionState('syncing');
    setStatusText('Syncing…');
    try {
      await GoogleSheetsRepo.syncNow();
      const syncAt = await GoogleSheetsRepo.getLastSync();
      setLastSync(syncAt);
      setConnectionState('connected');
      setStorageType('Google Sheets');
      setStatusText('Synced');
      Alert.alert('Sync complete', 'Data was synchronized successfully.');
    } catch (error) {
      setConnectionState('disconnected');
      setStorageType('Local');
      setStatusText('Sync failed');
      Alert.alert('Sync failed', 'Falling back to local storage.');
    }
  }

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
          badge={connectionBadge}
        />
        <View style={styles.inputBlock}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Spreadsheet ID</Text>
          <TextInput
            value={spreadsheetId}
            onChangeText={setSpreadsheetId}
            placeholder="Enter spreadsheet ID"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />
        </View>
        <View style={styles.inputBlock}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Service Account JSON</Text>
          <TextInput
            value={serviceAccountJson}
            onChangeText={setServiceAccountJson}
            placeholder="Paste service account JSON"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border }]}
          />
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleConnect}>
            <Text style={[styles.actionButtonText, { color: colors.background }]}>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={handleDisconnect}>
            <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Disconnect</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={handleTestConnection}>
            <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Test Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]} onPress={handleSyncNow}>
            <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Sync Now</Text>
          </TouchableOpacity>
        </View>
        <SettingRow icon="wifi-outline" label="Connection Status" value={statusText} />
        <SettingRow icon="time-outline" label="Last Sync" value={lastSync ? new Date(lastSync).toLocaleString() : 'Never'} />
        <SettingRow icon="archive-outline" label="Storage Type" value={storageType} />
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
          Google Sheets sync is now available. Connect with a service account JSON to sync patients and appointments across the clinic.
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
  inputBlock: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
