import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, Pressable, Dimensions, 
  ViewStyle, DimensionValue 
} from 'react-native';
import { ArrowUp, ArrowDown, X } from 'lucide-react-native';
import { Colors, Typography, Radii } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface TutorialStep {
  title: string;
  description: string;
  position: ViewStyle;
  arrowType: 'up' | 'down';
}

interface TutorialOverlayProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function TutorialOverlay({ visible, onClose, theme }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const c = Colors[theme as keyof typeof Colors];

  const steps: TutorialStep[] = [
    {
      title: "Квести та Геоквести",
      description: "Тут ти знайдеш завдання для ментального відновлення та прогулянок у реальному світі.",
      position: { top: '32%' as DimensionValue, left: '10%' as DimensionValue },
      arrowType: 'up',
    },
    {
      title: "Анонімна стрічка",
      description: "Ділись своїми думками та отримуй підтримку від спільноти абсолютно конфіденційно.",
      position: { top: '52%' as DimensionValue, left: '10%' as DimensionValue },
      arrowType: 'up',
    },
    {
      title: "Капсула часу",
      description: "Напиши листа собі у майбутнє. Він закриється і відкриється лише через обраний тобою час.",
      position: { bottom: '22%' as DimensionValue, left: '10%' as DimensionValue },
      arrowType: 'down',
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setStep(0); // Скидаємо для наступного разу
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={s.overlay}>
        {/* Кнопка пропуску */}
        <Pressable style={s.skipBtn} onPress={onClose}>
          <Text style={s.skipText}>Пропустити тур</Text>
          <X color="#FFF" size={18} />
        </Pressable>

        <View style={[s.infoCard, steps[step].position]}>
          {/* Стрілка ВГОРУ (для перших двох кроків) */}
          {steps[step].arrowType === 'up' && (
            <ArrowUp color={c.accent} size={40} style={{ marginBottom: 8 }} />
          )}

          <View style={[s.bubble, { backgroundColor: c.cardBg, borderColor: c.accent }]}>
            <Text style={[Typography.titleMd, { color: c.textMain }]}>{steps[step].title}</Text>
            <Text style={[Typography.body, { color: c.textMuted, marginTop: 8 }]}>
              {steps[step].description}
            </Text>
            
            <Pressable style={[s.nextBtn, { backgroundColor: c.accent }]} onPress={nextStep}>
              <Text style={s.nextBtnText}>
                {step === steps.length - 1 ? "Почати роботу" : "Далі"}
              </Text>
            </Pressable>
          </View>

          {/* Стрілка ВНИЗ (для останнього кроку) */}
          {steps[step].arrowType === 'down' && (
            <ArrowDown color={c.accent} size={40} style={{ marginTop: 8 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  skipBtn: { 
    position: 'absolute', 
    top: 60, 
    right: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    zIndex: 100 
  },
  skipText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  infoCard: { position: 'absolute', width: width * 0.8, alignItems: 'center' },
  bubble: { 
    padding: 20, 
    borderRadius: Radii.lg, 
    borderWidth: 2, 
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  nextBtn: { marginTop: 15, paddingVertical: 12, borderRadius: Radii.md, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});