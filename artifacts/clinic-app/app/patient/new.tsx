import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

export default function NewPatientScreen() {
  const colors = useColors();
  const { addPatient } = useData();
  const { showSnack } = useSnack();
  // redirect=appointment → after save, navigate directly to new appointment
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    childName: '',
    phone: '',
    notes: '',
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
      const newPatient = await addPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        childName: form.childName.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (redirect === 'appointment') {
        // Go straight to scheduling — no back() needed, patient is saved
        router.replace({
          pathname: '/appointment/new',
          params: { patientId: newPatient.id },
        });
      } else {
        showSnack('Patient added successfully', 'success');
        router.back();
      }
    } finally {
      setSaving(false);
    }
  };

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

        {redirect === 'appointment' && (
          <View style={[styles.redirectHint, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.redirectHintText, { color: colors.secondaryForeground }]}>
              After saving you'll be taken straight to schedule their first appointment.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: saving ? colors.mutedForeground : colors.primary },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : redirect === 'appointment' ? 'Add & Schedule Appointment' : 'Add Patient'}
          </Text>
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
  redirectHint: {
    borderRadius: 12,
    padding: 14,
  },
  redirectHintText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
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
