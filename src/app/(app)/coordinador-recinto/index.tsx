import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { Jrv } from '@features/territory/domain/entities/Jrv';
import { AssignVeedorModal } from '@features/territory/presentation/components/AssignVeedorModal';
import {
  CreateVeedorModal,
  VeedorFormValues,
} from '@features/territory/presentation/components/CreateVeedorModal';
import { JrvGridCard } from '@features/territory/presentation/components/JrvGridCard';
import { useRecintoManagement } from '@features/territory/presentation/hooks/useTerritory';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { AppButton } from '@shared/ui/components/AppButton';
import { FeedbackModal, FeedbackType } from '@shared/ui/components/FeedbackModal';
import { Colors } from '@shared/ui/theme/colors';
import { Href, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type JrvFilter = 'todas' | 'sin_asignar' | 'asignadas';

const FILTER_LABELS: Record<JrvFilter, string> = {
  todas: 'Todas',
  sin_asignar: 'Sin asignar',
  asignadas: 'Asignadas',
};

export default function CoordinadorRecintoHomeScreen() {
  const { user, logout, createSubordinateUser, isCreatingUser } = useAuth();
  const router = useRouter();
  const { jrvs, veedores, isLoading, assignVeedor, isAssigning } = useRecintoManagement(
    user?.recintoId ?? null,
  );

  const [selectedJrv, setSelectedJrv] = useState<Jrv | null>(null);
  const [showCreateVeedor, setShowCreateVeedor] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    type: FeedbackType;
    title: string;
    message: string;
  } | null>(null);
  const [jrvFilter, setJrvFilter] = useState<JrvFilter>('todas');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredJrvs = useMemo(() => {
    if (jrvFilter === 'sin_asignar') {
      return jrvs.filter((j) => !j.veedorId);
    }
    if (jrvFilter === 'asignadas') {
      return jrvs.filter((j) => Boolean(j.veedorId));
    }
    return jrvs;
  }, [jrvs, jrvFilter]);

  const handleAssign = async (jrvId: string, veedorId: string) => {
    try {
      await assignVeedor({ jrvId, veedorId });
      setSelectedJrv(null);
      setFeedbackModal({
        type: 'success',
        title: 'Asignación actualizada',
        message: 'El veedor fue asignado correctamente a la mesa.',
      });
    } catch (err: any) {
      setFeedbackModal({
        type: 'error',
        title: 'No se pudo asignar',
        message: err?.message ?? 'Ocurrió un error al asignar el veedor.',
      });
    }
  };

  const handleCreateVeedor = async (values: VeedorFormValues) => {
    if (!user?.recintoId) return;
    try {
      await createSubordinateUser({
        ...values,
        rol: 'veedor',
        recintoId: user.recintoId,
      });
      setShowCreateVeedor(false);
      setFeedbackModal({
        type: 'success',
        title: 'Veedor registrado',
        message: `Se envió la clave temporal y el enlace de verificación a ${values.email}. Ya puedes asignarlo a una o varias mesas.`,
      });
    } catch (err: any) {
      setFeedbackModal({
        type: 'error',
        title: 'No se pudo registrar',
        message: err?.message ?? 'Verifica la cédula, los nombres y el correo e intenta nuevamente.',
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AdnHero patternId="adnGridCoordRecinto" variant="home" onLogout={logout}>
          <Animated.View entering={FadeInDown.duration(350)} style={styles.greetingBlock}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>COORDINADOR DE RECINTO</Text>
            </View>
            <Text style={styles.userName}>
              {user?.nombres} {user?.apellidos}
            </Text>
            <Text style={styles.jurisdiction}>
              Mesas (JRV): {jrvs.length} · Veedores activos: {veedores.length}
            </Text>
          </Animated.View>
        </AdnHero>

        <View style={styles.body}>
          <AppButton
            title="+ Registrar nuevo veedor"
            onPress={() => setShowCreateVeedor(true)}
          />

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Mesas de tu recinto</Text>
            <View style={styles.dropdownAnchor}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowFilterMenu((prev) => !prev)}
                style={styles.filterTrigger}
              >
                <Text style={styles.filterTriggerText}>{FILTER_LABELS[jrvFilter]}</Text>
                <SymbolView
                  name={
                    showFilterMenu
                      ? { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }
                      : {
                          ios: 'chevron.down',
                          android: 'keyboard_arrow_down',
                          web: 'keyboard_arrow_down',
                        }
                  }
                  size={16}
                  tintColor={Colors.primary}
                />
              </TouchableOpacity>

              {showFilterMenu ? (
                <View style={styles.dropdownMenu}>
                  {(['todas', 'sin_asignar', 'asignadas'] as JrvFilter[]).map((option, idx) => {
                    const isSelected = jrvFilter === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        activeOpacity={0.75}
                        onPress={() => {
                          setJrvFilter(option);
                          setShowFilterMenu(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          idx < 2 ? styles.dropdownItemBorder : null,
                          isSelected ? styles.dropdownItemActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected ? styles.dropdownItemTextActive : null,
                          ]}
                        >
                          {FILTER_LABELS[option]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>

          {isLoading ? (
            <Text style={styles.emptyText}>Cargando mesas y veedores...</Text>
          ) : filteredJrvs.length === 0 ? (
            <Text style={styles.emptyText}>
              {jrvs.length === 0
                ? 'No hay mesas registradas en este recinto.'
                : 'No hay mesas que coincidan con este filtro.'}
            </Text>
          ) : (
            <View style={styles.jrvGrid}>
              {filteredJrvs.map((jrv, index) => (
                <JrvGridCard
                  key={jrv.id}
                  jrv={jrv}
                  index={index}
                  onAssignPress={() => setSelectedJrv(jrv)}
                  onReviewActas={() =>
                    router.push(
                      `/(app)/veedor/scrutiny/${jrv.id}?numero=${jrv.numeroMesa}&genero=${encodeURIComponent(jrv.genero)}&recinto=${encodeURIComponent(jrv.recintoNombre ?? '')}` as Href,
                    )
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AssignVeedorModal
        jrv={selectedJrv}
        veedores={veedores}
        isAssigning={isAssigning}
        onClose={() => setSelectedJrv(null)}
        onSelectVeedor={handleAssign}
      />

      <CreateVeedorModal
        visible={showCreateVeedor}
        isLoading={isCreatingUser}
        onClose={() => setShowCreateVeedor(false)}
        onSubmit={handleCreateVeedor}
      />

      <FeedbackModal
        visible={Boolean(feedbackModal)}
        type={feedbackModal?.type ?? 'info'}
        title={feedbackModal?.title}
        message={feedbackModal?.message ?? ''}
        onClose={() => setFeedbackModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  greetingBlock: {
    gap: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleBadgeText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  jurisdiction: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  body: {
    padding: 20,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    zIndex: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  dropdownAnchor: {
    position: 'relative',
    zIndex: 30,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primaryMedium,
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    minWidth: 145,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 40,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  dropdownItemTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },
  jrvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  infoBanner: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  successBanner: {
    backgroundColor: Colors.successBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
    gap: 4,
  },
  successTitle: { color: Colors.success, fontWeight: '800', fontSize: 15 },
  successText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  successHint: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
});
