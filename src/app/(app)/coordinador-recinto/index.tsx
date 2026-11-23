import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { useRecintoManagement } from '@features/territory/presentation/hooks/useTerritory';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CoordinadorRecintoHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { jrvs, veedores, isLoading, assignVeedor, isAssigning } = useRecintoManagement(
    user?.recintoId ?? null,
  );

  const [editingJrvId, setEditingJrvId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAssign = async (jrvId: string, veedorId: string | null) => {
    try {
      setFeedback(null);
      await assignVeedor({ jrvId, veedorId });
      setEditingJrvId(null);
      setFeedback('Asignación de veedor actualizada.');
    } catch (err: any) {
      setFeedback(err?.message ?? 'No se pudo asignar el veedor.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.role}>COORDINADOR DE RECINTO</Text>
        <Text style={styles.name}>
          {user?.nombres} {user?.apellidos}
        </Text>
        <Text style={styles.subtitle}>
          Mesas (JRV): {jrvs.length} · Veedores activos: {veedores.length}
        </Text>
      </View>

      {feedback ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>{feedback}</Text>
        </View>
      ) : null}

      <AppButton
        title="+ Registrar nuevo veedor (o reemplazo)"
        onPress={() => router.push('/(app)/coordinador-recinto/create-veedor' as Href)}
      />

      <Text style={styles.sectionTitle}>Mesas de tu recinto</Text>

      {isLoading ? (
        <Text style={styles.emptyText}>Cargando mesas y veedores...</Text>
      ) : jrvs.length === 0 ? (
        <Text style={styles.emptyText}>No hay mesas registradas en este recinto.</Text>
      ) : (
        jrvs.map((jrv) => (
          <View key={jrv.id} style={styles.jrvCard}>
            <View style={styles.jrvHeader}>
              <Text style={styles.jrvTitle}>
                Mesa #{jrv.numeroMesa} · {jrv.genero}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingJrvId((prev) => (prev === jrv.id ? null : jrv.id))}
              >
                <Text style={styles.actionLink}>
                  {editingJrvId === jrv.id ? 'Cerrar' : jrv.veedorId ? 'Reemplazar' : 'Asignar'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.veedorLabel}>
              Veedor: {jrv.veedorNombre ?? '⚠️ Sin veedor asignado'}
            </Text>

            {editingJrvId === jrv.id ? (
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>Selecciona un veedor de tu recinto:</Text>
                {veedores.length === 0 ? (
                  <Text style={styles.emptyText}>Primero registra al menos un veedor.</Text>
                ) : (
                  veedores.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      disabled={isAssigning}
                      onPress={() => handleAssign(jrv.id, v.id)}
                      style={[
                        styles.veedorOption,
                        jrv.veedorId === v.id ? styles.veedorSelected : null,
                      ]}
                    >
                      <Text style={styles.veedorOptionText}>
                        {v.nombres} {v.apellidos} ({v.cedula})
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : null}
          </View>
        ))
      )}

      <AppButton title="Cerrar sesión" variant="danger" onPress={logout} style={styles.logoutBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 54,
    backgroundColor: Colors.background,
    gap: 14,
  },
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  role: { fontSize: 12, fontWeight: '700', color: Colors.primaryLight, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: Colors.primaryLight, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 4 },
  jrvCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  jrvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jrvTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  actionLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  veedorLabel: { fontSize: 14, color: Colors.textSecondary },
  pickerBox: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  pickerTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  veedorOption: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  veedorSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  veedorOptionText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  infoBanner: { backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 10 },
  infoText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  logoutBtn: { marginTop: 10 },
});
