import { SentryIssueSummary } from '@features/tracking/domain/entities/TrackingStats';
import { AnimatedModal } from '@shared/ui/components/AnimatedModal';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorDetailModalProps {
  issue: SentryIssueSummary | null;
  onClose: () => void;
}

export function ErrorDetailModal({ issue, onClose }: ErrorDetailModalProps) {
  const [activeIssue, setActiveIssue] = useState<SentryIssueSummary | null>(issue);

  if (issue && issue !== activeIssue) {
    setActiveIssue(issue);
  }

  const currentIssue = issue ?? activeIssue;

  const openLocationInMaps = (coords: string) => {
    const clean = coords.replace(/\s+/g, '');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${clean}`);
  };

  return (
    <AnimatedModal visible={Boolean(issue)} onClose={onClose} contentStyle={styles.modalCard}>
      {currentIssue ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>{currentIssue.level.toUpperCase()}</Text>
              </View>
              <Text style={styles.headerTitle}>Detalle del Fallo</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar detalle"
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={18}
                tintColor={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.errorBox}>
              <Text style={styles.sectionLabel}>MENSAJE DEL ERROR</Text>
              <Text style={styles.errorMessage}>{currentIssue.title}</Text>
              <Text style={styles.culpritText}>Origen: {currentIssue.culprit}</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Usuario afectado</Text>
                <Text style={styles.infoValue}>{currentIssue.affectedUser}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pantalla</Text>
                <Text style={styles.infoValue}>{currentIssue.screen}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dispositivo y SO</Text>
                <Text style={styles.infoValue}>
                  {currentIssue.deviceModel} · {currentIssue.osVersion}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ocurrencias</Text>
                <Text style={styles.infoValue}>
                  {currentIssue.count} {currentIssue.count === 1 ? 'vez' : 'veces'} (
                  {currentIssue.userCount} {currentIssue.userCount === 1 ? 'persona' : 'personas'})
                </Text>
              </View>

              {currentIssue.lastSeen ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Último reporte</Text>
                  <Text style={styles.infoValue}>
                    {new Date(currentIssue.lastSeen).toLocaleString()}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Ubicación GPS</Text>
                {currentIssue.location ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openLocationInMaps(currentIssue.location!)}
                    style={styles.mapInlineBtn}
                  >
                    <SymbolView
                      name={{ ios: 'map', android: 'location_on', web: 'location_on' }}
                      size={14}
                      tintColor={Colors.success}
                    />
                    <Text style={styles.mapInlineText}>{currentIssue.location} · Ver mapa</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoMuted}>No disponible en este evento</Text>
                )}
              </View>
            </View>

            <AppButton title="Cerrar" variant="secondary" onPress={onClose} />
          </ScrollView>
        </>
      ) : null}
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 6, 36, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  levelPill: {
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.danger,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 14,
    paddingBottom: 4,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.danger,
    letterSpacing: 0.6,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 20,
  },
  culpritText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  infoGrid: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 2,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  infoMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mapInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  mapInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
});
