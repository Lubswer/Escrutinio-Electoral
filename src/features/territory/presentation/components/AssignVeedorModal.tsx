import { Jrv, VeedorSummary } from '@features/territory/domain/entities/Jrv';
import { AnimatedModal } from '@shared/ui/components/AnimatedModal';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AssignVeedorModalProps {
  jrv: Jrv | null;
  veedores: VeedorSummary[];
  isAssigning: boolean;
  onClose: () => void;
  onSelectVeedor: (jrvId: string, veedorId: string) => void;
}

export function AssignVeedorModal({
  jrv,
  veedores,
  isAssigning,
  onClose,
  onSelectVeedor,
}: AssignVeedorModalProps) {
  const [activeJrv, setActiveJrv] = useState<Jrv | null>(jrv);

  if (jrv && jrv !== activeJrv) {
    setActiveJrv(jrv);
  }

  const currentJrv = jrv ?? activeJrv;

  return (
    <AnimatedModal visible={Boolean(jrv)} onClose={onClose} contentStyle={styles.modalCard}>
      {currentJrv ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {currentJrv.veedorId ? 'Reemplazar Veedor' : 'Asignar Veedor'}
              </Text>
              <Text style={styles.subtitle}>
                Mesa #{currentJrv.numeroMesa} · {currentJrv.genero}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar modal"
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={18}
                tintColor={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {veedores.length === 0 ? (
              <Text style={styles.emptyText}>
                Primero registra al menos un veedor en tu recinto.
              </Text>
            ) : (
              veedores.map((v) => {
                const isCurrent = currentJrv.veedorId === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    activeOpacity={0.8}
                    disabled={isAssigning}
                    onPress={() => onSelectVeedor(currentJrv.id, v.id)}
                    style={[styles.veedorOption, isCurrent ? styles.veedorSelected : null]}
                  >
                    <View style={styles.veedorInfo}>
                      <Text style={styles.veedorName}>
                        {v.nombres} {v.apellidos}
                      </Text>
                      <Text style={styles.veedorCedula}>CI: {v.cedula}</Text>
                    </View>
                    {isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Actual</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <AppButton
            title="Cancelar"
            variant="secondary"
            onPress={onClose}
            disabled={isAssigning}
          />
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
    maxHeight: '80%',
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryMedium,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 14,
  },
  veedorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  veedorSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  veedorInfo: {
    flex: 1,
    gap: 2,
  },
  veedorName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  veedorCedula: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
