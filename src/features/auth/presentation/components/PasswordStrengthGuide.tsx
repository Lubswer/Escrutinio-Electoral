import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PasswordStrength {
  score: number; // 0..4
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (password.length === 0) {
    return { score: 0, label: 'Ingresa tu clave', color: Colors.textSecondary, checks };
  }
  if (score <= 1) {
    return { score: 1, label: 'Débil', color: Colors.danger, checks };
  }
  if (score === 2) {
    return { score: 2, label: 'Regular', color: Colors.warning, checks };
  }
  if (score === 3) {
    return { score: 3, label: 'Buena', color: Colors.primaryMedium, checks };
  }
  return { score: 4, label: 'Fuerte', color: Colors.success, checks };
}

interface PasswordStrengthGuideProps {
  password: string;
  compact?: boolean;
}

export function PasswordStrengthGuide({ password, compact = false }: PasswordStrengthGuideProps) {
  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const missingRequired: string[] = [];
  if (!strength.checks.minLength) missingRequired.push('8+ caracteres');
  if (!strength.checks.hasUpper) missingRequired.push('1 mayúscula');
  if (!strength.checks.hasNumber) missingRequired.push('1 número');

  const compactHint =
    password.length === 0
      ? 'Mín. 8 caracteres, 1 mayúscula y 1 número'
      : missingRequired.length > 0
        ? `Falta: ${missingRequired.join(', ')}`
        : !strength.checks.hasSymbol
          ? 'Opcional: agrega 1 símbolo para mayor seguridad'
          : 'Contraseña segura';

  if (compact) {
    return (
      <View style={styles.compactBox}>
        <View style={styles.barsRow}>
          {[1, 2, 3, 4].map((segment) => (
            <View
              key={segment}
              style={[
                styles.compactBarSegment,
                {
                  backgroundColor: strength.score >= segment ? strength.color : Colors.border,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.compactFooter}>
          <Text style={[styles.compactLevel, { color: strength.color }]}>{strength.label}</Text>
          <Text style={styles.compactHint} numberOfLines={2}>
            {compactHint}
          </Text>
        </View>
      </View>
    );
  }

  const criteriaList = [
    { key: 'minLength', label: 'Mínimo 8 caracteres', met: strength.checks.minLength },
    { key: 'hasUpper', label: 'Al menos 1 letra mayúscula', met: strength.checks.hasUpper },
    { key: 'hasNumber', label: 'Al menos 1 número', met: strength.checks.hasNumber },
    { key: 'hasSymbol', label: 'Al menos 1 símbolo (recomendado)', met: strength.checks.hasSymbol },
  ];

  return (
    <View style={styles.strengthBox}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthLabel}>Seguridad de la clave</Text>
        <Text style={[styles.strengthValue, { color: strength.color }]}>{strength.label}</Text>
      </View>

      <View style={styles.barsRow}>
        {[1, 2, 3, 4].map((segment) => (
          <View
            key={segment}
            style={[
              styles.barSegment,
              {
                backgroundColor: strength.score >= segment ? strength.color : Colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.criteriaList}>
        {criteriaList.map((item) => (
          <View key={item.key} style={styles.criteriaRow}>
            <SymbolView
              name={
                item.met
                  ? {
                      ios: 'checkmark.circle.fill',
                      android: 'check_circle',
                      web: 'check_circle',
                    }
                  : {
                      ios: 'circle',
                      android: 'radio_button_unchecked',
                      web: 'radio_button_unchecked',
                    }
              }
              size={16}
              tintColor={item.met ? Colors.success : Colors.border}
            />
            <Text style={[styles.criteriaText, item.met ? styles.criteriaTextMet : null]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strengthBox: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 14,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  strengthValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  barsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  barSegment: {
    flex: 1,
    height: 6,
    borderRadius: 4,
  },
  criteriaList: {
    gap: 6,
    marginTop: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criteriaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  criteriaTextMet: {
    color: Colors.text,
  },
  compactBox: {
    gap: 5,
    marginTop: -6,
    marginBottom: 12,
  },
  compactBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 3,
  },
  compactFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactLevel: {
    fontSize: 11,
    fontWeight: '800',
  },
  compactHint: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 15,
  },
});
