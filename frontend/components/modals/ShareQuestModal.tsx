import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Share, Check, Ghost } from 'lucide-react-native';
import { Colors, Typography, Radii } from '@/constants/theme';

export default function ShareQuestModal({
  visible,
  onClose,
  onShare,
  isAnonymous,
  setIsAnonymous,
  isSharing,
  themeKey,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  isAnonymous: boolean;
  setIsAnonymous: (val: boolean) => void;
  isSharing: boolean;
  themeKey: 'light' | 'dark';
  isDark: boolean;
}) {
  const c = Colors[themeKey];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalOverlay}>
        <View style={[s.shareModal, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }]}>
          <View style={[s.shareIconBox, { backgroundColor: c.iconBg }]}>
            <Share color={c.iconColor} size={32} />
          </View>
          <Text style={[Typography.titleLg, { color: c.textMain, textAlign: 'center', marginBottom: 8 }]}>
            Квест виконано! 🎉
          </Text>
          <Text style={[Typography.body, { color: c.textMuted, textAlign: 'center', marginBottom: 24 }]}>
            Поділися цим досягненням у стрічці, щоб надихнути інших.
          </Text>

          <Pressable
            onPress={() => setIsAnonymous(!isAnonymous)}
            style={[s.checkboxRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}
          >
            <View style={[s.checkbox, { borderColor: c.textMuted }, isAnonymous && { backgroundColor: c.accent, borderColor: c.accent }]}>
              {isAnonymous && <Check color="#FFF" size={14} strokeWidth={3} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[Typography.body, { color: c.textMain }]}>Опублікувати анонімно</Text>
              <Text style={[Typography.nav, { color: c.textMuted }]}>Твоє ім'я буде приховано</Text>
            </View>
            <Ghost color={isAnonymous ? c.accent : c.textMuted} size={24} />
          </Pressable>

          <View style={s.modalButtons}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [s.cancelBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }, pressed && { opacity: 0.8 }]}
            >
              <Text style={[Typography.button, { color: c.textMain }]}>Ні, дякую</Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              disabled={isSharing}
              style={({ pressed }) => [s.confirmBtn, { backgroundColor: c.accent }, pressed && { opacity: 0.8 }, isSharing && { opacity: 0.7 }]}
            >
              {isSharing ? <ActivityIndicator color="#FFF" /> : (
                <Text style={[Typography.button, { color: '#FFF' }]}>Поділитися</Text>
              )}
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
  shareIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: Radii.md, marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
});
