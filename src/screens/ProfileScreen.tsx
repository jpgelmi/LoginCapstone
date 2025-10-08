import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      '🔐 Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getUserRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'athlete':
        return 'Atleta';
      case 'health_team':
        return 'Equipo Médico';
      case 'temp_health_team':
        return 'Equipo Médico (Temporal)';
      case 'trainer':
        return 'Entrenador';
      default:
        return role;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró información del usuario</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>👤</Text>
          </View>
          <Text style={styles.nameText}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.roleText}>
            {getUserRoleDisplayName(user.role)}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>RUT</Text>
            <Text style={styles.infoValue}>{user.rut}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{user.phone || 'No especificado'}</Text>
          </View>
        </View>

        {/* Información específica para atletas */}
        {user.role === 'athlete' && user.athleteData && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Información Deportiva</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
              <Text style={styles.infoValue}>
                {user.athleteData.birthDate || 'No especificada'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sexo Biológico</Text>
              <Text style={styles.infoValue}>
                {user.athleteData.biologicalSex || 'No especificado'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Disciplina Deportiva</Text>
              <Text style={styles.infoValue}>
                {user.athleteData.sportDiscipline || 'No especificada'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Establecimiento</Text>
              <Text style={styles.infoValue}>
                {user.athleteData.establishment || 'No especificado'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Seguro Médico</Text>
              <Text style={styles.infoValue}>
                {user.athleteData.insurance?.type || 'No especificado'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Aspiración Profesional</Text>
              <Text style={styles.infoValue}>
                {user.athleteData.professionalAspiration ? 'Sí' : 'No'}
              </Text>
            </View>

            {user.athleteData.pucData && (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Carrera PUC</Text>
                  <Text style={styles.infoValue}>
                    {user.athleteData.pucData.career}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Nivel Competitivo</Text>
                  <Text style={styles.infoValue}>
                    {user.athleteData.pucData.competitiveLevel}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Año de Ingreso</Text>
                  <Text style={styles.infoValue}>
                    {user.athleteData.pucData.universityEntryYear}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Año de Egreso Proyectado</Text>
                  <Text style={styles.infoValue}>
                    {user.athleteData.pucData.projectedGraduationYear}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Información específica para equipo médico */}
        {(user.role === 'health_team' || user.role === 'temp_health_team') && user.healthTeamData && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Información Médica</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Disciplina</Text>
              <Text style={styles.infoValue}>
                {user.healthTeamData.discipline || 'No especificada'}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Es Estudiante</Text>
              <Text style={styles.infoValue}>
                {user.healthTeamData.isStudent !== undefined 
                  ? (user.healthTeamData.isStudent ? 'Sí' : 'No')
                  : 'No especificado'
                }
              </Text>
            </View>

            {user.healthTeamData.rotationEndDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fin de Rotación</Text>
                <Text style={styles.infoValue}>
                  {user.healthTeamData.rotationEndDate}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🔓 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  
  headerContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIconText: {
    fontSize: 32,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  
  actionSection: {
    paddingVertical: 24,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  footerSpacer: {
    height: 24,
  },
});

export default ProfileScreen;