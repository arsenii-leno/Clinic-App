import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { useSnack } from '@/context/SnackBarContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

interface FormState {
  firstName: string;
  lastName: string;
  childName: string;
  phone: string;
  notes: string;
}

interface Errors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export default function EditPatientScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPatientById, editPatient } = useData();
  const { showSnack } = useSnack();

  const patient = getPatientById(id);

  const [form, setForm] = useState<FormState>({
    firstName: patient?.firstName ?? '',
    lastName: patient?.lastName ?? '',
    childName: patient?.childName ?? '',
    phone: patient?.phone ?? '',
    notes: patient?.notes ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const update = (key: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key as keyof Errors]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await editPatient(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        childName: form.childName.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnack('Patient updated', 'success');
      router.back();
    } catch {
      Alert.alert('Unable to save patient', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!patient) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 40 }}>
          Patient not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={80}
      >
        <Field
          label="First Name *"
          value={form.firstName}
          onChangeText={(v) => update('firstName', v)}
          placeholder="e.g. Sarah"
          error={errors.firstName}
          colors={colors}
          autoCapitalize="words"
        />
        <Field
          label="Last Name *"
          value={form.lastName}
          onChangeText={(v) => update('lastName', v)}
          placeholder="e.g. Johnson"
          error={errors.lastName}
          colors={colors}
          autoCapitalize="words"
        />
        <Field
          label="Child's Name"
          value={form.childName}
          onChangeText={(v) => update('childName', v)}
          placeholder="e.g. Emma"
          colors={colors}
          autoCapitalize="words"
        />
        <Field
          label="Phone Number *"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          placeholder="e.g. 555-234-5678"
          error={errors.phone}
          colors={colors}
          keyboardType="phone-pad"
        />
        <Field
          label="Notes"
          value={form.notes}
          onChangeText={(v) => update('notes', v)}
          placeholder="Allergies, preferences, other info..."
          colors={colors}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: saving ? colors.mutedForeground : colors.primary },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  colors,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  colors: ReturnType<typeof useColors>;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
            height: multiline ? 100 : 52,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  fieldWrap: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  error: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
});
