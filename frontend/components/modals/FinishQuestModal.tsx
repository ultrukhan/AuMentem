import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Check, Image as ImageIcon } from 'lucide-react-native';
import { Colors, Typography, Radii } from '@/constants/theme';

export default function FinishQuestModal({
  visible,
  onClose,
  onConfirm,
  saveToAlbum,
  setSaveToAlbum,
  themeKey,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saveToAlbum: boolean;
  setSaveToAlbum: (val: boolean) => void;
  themeKey: 'light' | 'dark';
  isDark: boolean;
}) {
  const c = Colors[themeKey];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalOverlay}>
        <View style={[s.shareModal, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 16 }]}>
            Ти на місці! 🎯
          </Text>
          
          <Pressable 
            onPress={() => setSaveToAlbum(!saveToAlbum)} 
            style={[s.checkboxRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', marginBottom: 24 }]}
          >
            <View style={[s.checkbox, { borderColor: c.textMuted }, saveToAlbum && { backgroundColor: c.accent, borderColor: c.accent }]}>
              {saveToAlbum && <Check color="#FFF" size={14} strokeWidth={3} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[Typography.body, { color: c.textMain }]}>Зберегти в альбом</Text>
              <Text style={[Typography.nav, { color: c.textMuted }]}>Зробити фото на пам'ять</Text>
            </View>
            <ImageIcon color={saveToAlbum ? c.accent : c.textMuted} size={24} />
          </Pressable>

          <View style={s.modalButtons}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [s.cancelBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.8 }]}
            >
              <Text style={[Typography.button, { color: c.textMain }]}>Скасувати</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [s.confirmBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }]}
            >
              <Text style={[Typography.button, { color: '#FFF' }]}>Завершити</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  shareModal: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radii.md, marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
});
