import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { GoogleSheetsRepository, CONFIG_KEYS } from '@/repository/GoogleSheetsRepository';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

type IconName = keyof typeof Ionicons.glyphMap;

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{label}</Text>;
}

function SettingRow({ icon, label, value }: { icon: IconName; label: string; value?: string }) {
  const colors = useColors();
  return (
      <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const savedUrl = await AsyncStorage.getItem(CONFIG_KEYS.WEB_APP_URL);
      if (savedUrl) setUrl(savedUrl);
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(CONFIG_KEYS.WEB_APP_URL, url.trim());
      Alert.alert('Saved', 'Integration settings have been saved locally.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      Alert.alert('Missing URL', 'Please enter the Apps Script URL first.');
      return;
    }

    setTesting(true);
    try {
      // Автозбереження перед тестом для правильного UX
      await AsyncStorage.setItem(CONFIG_KEYS.WEB_APP_URL, url.trim());

      const repo = new GoogleSheetsRepository();
      const isSuccess = await repo.ping();

      if (isSuccess) {
        Alert.alert('Success!', 'Successfully connected to Google Sheets.');
      } else {
        Alert.alert('Connection Failed', 'Could not reach the server or verify the token.');
      }
    } catch (error) {
      Alert.alert('Connection Error', String(error));
    } finally {
      setTesting(false);
    }
  };

  return (
      <KeyboardAwareScrollViewCompat
          style={[styles.flex, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.content}
      >
        <SectionHeader label="DATA & STORAGE" />
        <View style={[styles.section, { borderColor: colors.border }]}>
          <SettingRow icon="phone-portrait-outline" label="Cache" value="Active (AsyncStorage)" />
          <SettingRow icon="cloud-done-outline" label="Sync Strategy" value="Append-only" />
        </View>

        <SectionHeader label="GOOGLE SHEETS SYNC" />
        <View style={[styles.section, { borderColor: colors.border }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Apps Script URL</Text>
            <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={url}
                onChangeText={setUrl}
                placeholder="https://script.google.com/macros/s/.../exec"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.secondary }]}
              onPress={handleTestConnection}
              disabled={testing || saving}
          >
            <Text style={[styles.btnText, { color: colors.primary }]}>
              {testing ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={testing || saving}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
            URLs are saved only on this device's local storage.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
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
    marginBottom: 20,
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 28,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
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