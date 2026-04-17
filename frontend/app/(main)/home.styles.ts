import { Platform, StyleSheet } from 'react-native';
import { Spacing, Radii } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: { flex: 1 },
  background: { flex: 1 },
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  content: { 
    flex: 1, 
    paddingHorizontal: Spacing.screenX, 
    paddingTop: Spacing.screenTop / 2, 
    paddingBottom: 160
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.headMb },
  headerActions: { flexDirection: 'row', gap: 12 },
  cardsContainer: { gap: Spacing.gap },
  cardsRow: { flexDirection: 'row', gap: Spacing.gap },
  
  card: { 
    flex: 1, 
    aspectRatio: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: Spacing.cardP, 
    borderRadius: Radii.lg, 
    borderWidth: 1 
  },
  feedCard: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: Radii.lg, 
    borderWidth: 1 
  },
  
  iconBox: { marginBottom: 12, padding: 12, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  feedIconBox: { marginRight: 16, padding: 16, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  feedText: { flex: 1 },
  feedTitle: { marginBottom: 4 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});