import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '@/models/types';
import { useColors } from '@/hooks/useColors';
import { SearchBar } from '@/components/SearchBar';

interface Props {
  visible: boolean;
  patients: Patient[];
  selectedId?: string;
  onSelect: (patient: Patient) => void;
  onClose: () => void;
}

export function PatientSelectorModal({ visible, patients, selectedId, onSelect, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(query.toLowerCase()) ||
          p.lastName.toLowerCase().includes(query.toLowerCase()) ||
          p.childName.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query),
      )
    : patients;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 0 : insets.top + 12 },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Select Patient</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search patients..." autoFocus />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {query ? 'No patients found' : 'No patients yet'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.id === selectedId;
            const initials = (item.firstName.charAt(0) + item.lastName.charAt(0)).toUpperCase();
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  { borderBottomColor: colors.border },
                  isActive && { backgroundColor: colors.secondary },
                ]}
                onPress={() => { onSelect(item); onClose(); setQuery(''); }}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.foreground }]}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.childName ? (
                    <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                      Child: {item.childName}
                    </Text>
                  ) : null}
                  <Text style={[styles.sub, { color: colors.mutedForeground }]}>{item.phone}</Text>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  searchWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: 14,
    borderRadius: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
});
