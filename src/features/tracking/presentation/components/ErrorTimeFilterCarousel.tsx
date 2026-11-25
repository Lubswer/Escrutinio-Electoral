import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface DayOption {
  key: string; // 'all' | 'YYYY-MM-DD'
  label: string;
}

interface ErrorTimeFilterCarouselProps {
  dayOptions: DayOption[];
  selectedDayKey: string;
  onSelectDay: (dayKey: string) => void;
  selectedHour: number | null; // null = Todas las horas, 0..23 = hora específica
  onSelectHour: (hour: number | null) => void;
  countsByHour: Record<number, number>;
}

interface HourSlot {
  hour: number | null;
  topLabel: string;
  bottomLabel: string;
}

const HOUR_SLOTS: HourSlot[] = [
  { hour: null, topLabel: 'Todas', bottomLabel: '24h' },
  ...Array.from({ length: 24 }, (_, h) => {
    const period = h < 12 ? 'AM' : 'PM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return {
      hour: h,
      topLabel: String(hour12),
      bottomLabel: period,
    };
  }),
];

export function ErrorTimeFilterCarousel({
  dayOptions,
  selectedDayKey,
  onSelectDay,
  selectedHour,
  onSelectHour,
  countsByHour,
}: ErrorTimeFilterCarouselProps) {
  const [showDayPicker, setShowDayPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selectedDayLabel = useMemo(
    () => dayOptions.find((d) => d.key === selectedDayKey)?.label ?? 'Todos los días',
    [dayOptions, selectedDayKey],
  );

  const selectedIndex = useMemo(
    () => HOUR_SLOTS.findIndex((s) => s.hour === selectedHour),
    [selectedHour],
  );

  const handlePressHour = (hour: number | null, index: number) => {
    onSelectHour(hour);
    const targetX = Math.max(0, index * 66 - 110);
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  return (
    <View style={styles.container}>
      {/* Selector de Día arriba centrado */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowDayPicker((prev) => !prev)}
        style={styles.dayHeaderBtn}
      >
        <Text style={styles.dayHeaderText}>{selectedDayLabel}</Text>
        <SymbolView
          name={
            showDayPicker
              ? { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }
              : { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }
          }
          size={20}
          tintColor={Colors.accent}
        />
      </TouchableOpacity>

      {showDayPicker ? (
        <View style={styles.dayDropdown}>
          {dayOptions.map((day) => {
            const isSelected = day.key === selectedDayKey;
            return (
              <TouchableOpacity
                key={day.key}
                activeOpacity={0.8}
                onPress={() => {
                  onSelectDay(day.key);
                  setShowDayPicker(false);
                }}
                style={[styles.dayOptionChip, isSelected ? styles.dayOptionChipActive : null]}
              >
                <Text
                  style={[styles.dayOptionText, isSelected ? styles.dayOptionTextActive : null]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Carrusel de cápsulas de horas con efecto arco/profundidad */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.capsulesRow}
      >
        {HOUR_SLOTS.map((slot, index) => {
          const isSelected = slot.hour === selectedHour;
          const distance = Math.abs(index - selectedIndex);
          const translateY = isSelected ? -8 : distance === 1 ? 0 : 7;
          const hasErrors = slot.hour !== null && (countsByHour[slot.hour] ?? 0) > 0;

          return (
            <TouchableOpacity
              key={slot.hour === null ? 'all' : String(slot.hour)}
              activeOpacity={0.85}
              onPress={() => handlePressHour(slot.hour, index)}
              style={[
                styles.capsule,
                isSelected
                  ? styles.capsuleSelected
                  : distance === 1
                    ? styles.capsuleNear
                    : styles.capsuleFar,
                { transform: [{ translateY }] },
              ]}
            >
              <Text
                style={[
                  styles.capsuleTopText,
                  isSelected ? styles.capsuleTopSelected : styles.capsuleTopInactive,
                  slot.hour === null ? styles.capsuleAllText : null,
                ]}
              >
                {slot.topLabel}
              </Text>
              <Text
                style={[
                  styles.capsuleBottomText,
                  isSelected ? styles.capsuleBottomSelected : styles.capsuleBottomInactive,
                ]}
              >
                {slot.bottomLabel}
              </Text>
              {hasErrors ? (
                <View
                  style={[
                    styles.errorIndicatorDot,
                    { backgroundColor: isSelected ? Colors.primaryDark : Colors.accent },
                  ]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingTop: 10,
    paddingBottom: 4,
    gap: 10,
  },
  dayHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  dayHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dayDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  dayOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  dayOptionChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayOptionTextActive: {
    color: Colors.primaryDark,
    fontWeight: '900',
  },
  capsulesRow: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
    alignItems: 'center',
  },
  capsule: {
    width: 56,
    height: 82,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  capsuleSelected: {
    backgroundColor: Colors.accent,
    height: 90,
    width: 60,
    borderRadius: 30,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  capsuleNear: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  capsuleFar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  capsuleTopText: {
    fontSize: 18,
    fontWeight: '800',
  },
  capsuleAllText: {
    fontSize: 12,
    fontWeight: '900',
  },
  capsuleTopSelected: {
    color: Colors.primaryDark,
    fontWeight: '900',
  },
  capsuleTopInactive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  capsuleBottomText: {
    fontSize: 12,
    fontWeight: '600',
  },
  capsuleBottomSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  capsuleBottomInactive: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  errorIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
});
