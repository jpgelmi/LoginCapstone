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

const DashboardScreen: React.FC = () => {
  const { user, logout, loading } = useAuth();

  // Manejar logout
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  // Obtener información específica del rol
  const getRoleSpecificInfo = () => {
    if (!user) return null;

    switch (user.role) {
      case 'athlete':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>Información Deportiva</Text>
            <InfoRow label="Disciplina" value={user.athleteData?.sportDiscipline} />
            <InfoRow label="Establecimiento" value={user.athleteData?.establishment} />
            <InfoRow label="Sexo Biológico" value={user.athleteData?.biologicalSex} />
            <InfoRow label="Seguro" value={user.athleteData?.insurance?.type} />
            <InfoRow 
              label="Aspiración Profesional" 
              value={user.athleteData?.professionalAspiration ? 'Sí' : 'No'} 
            />
            
            {user.athleteData?.pucData && (
              <>
                <Text style={styles.subSectionTitle}>Información PUC</Text>
                <InfoRow label="Carrera" value={user.athleteData.pucData.career} />
                <InfoRow label="Nivel Competitivo" value={user.athleteData.pucData.competitiveLevel} />
                <InfoRow label="Año Ingreso" value={user.athleteData.pucData.universityEntryYear?.toString()} />
                <InfoRow label="Año Graduación" value={user.athleteData.pucData.projectedGraduationYear?.toString()} />
              </>
            )}
          </View>
        );

      case 'health_team':
      case 'temp_health_team':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>Información del Equipo de Salud</Text>
            <InfoRow label="Disciplina" value={user.healthTeamData?.discipline} />
            {user.healthTeamData?.isStudent !== undefined && (
              <InfoRow label="Estudiante" value={user.healthTeamData.isStudent ? 'Sí' : 'No'} />
            )}
            {user.healthTeamData?.rotationEndDate && (
              <InfoRow label="Fin de Rotación" value={user.healthTeamData.rotationEndDate} />
            )}
          </View>
        );

      case 'trainer':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>Información del Entrenador</Text>
            <InfoRow label="Establecimiento" value={user.trainerData?.establishment} />
            <InfoRow label="Disciplina" value={user.trainerData?.sportDiscipline} />
            <InfoRow label="Categoría" value={user.trainerData?.category} />
          </View>
        );

      case 'admin':
        return (
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>Panel de Administración</Text>
            <Text style={styles.adminInfo}>
              Tienes acceso completo al sistema de gestión.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // Obtener el nombre del rol en español
  const getRoleName = (role: string) => {
    switch (role) {
      case 'athlete': return 'Deportista';
      case 'health_team': return 'Equipo de Salud';
      case 'temp_health_team': return 'Equipo de Salud Temporal';
      case 'trainer': return 'Entrenador';
      case 'admin': return 'Administrador';
      default: return role;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: No se encontró información del usuario</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.logoutButtonText}>
              {loading ? 'Cerrando...' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información del usuario */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          {user.secondLastName && (
            <Text style={styles.userSecondName}>{user.secondLastName}</Text>
          )}
          <Text style={styles.userRole}>{getRoleName(user.role)}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <InfoRow label="RUT" value={user.rut} />
          <InfoRow label="Teléfono" value={user.phone} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Rol" value={getRoleName(user.role)} />
        </View>

        {/* Información específica del rol */}
        {getRoleSpecificInfo()}

        {/* Acciones adicionales */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ver Configuración</Text>
          </TouchableOpacity>
          
          {user.role === 'admin' && (
            <TouchableOpacity style={[styles.actionButton, styles.adminButton]}>
              <Text style={styles.adminButtonText}>Panel de Administración</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Componente auxiliar para mostrar información
const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#24292E',
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#24292E',
    textAlign: 'center',
  },
  userSecondName: {
    fontSize: 20,
    color: '#586069',
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#586069',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 8,
  },
  roleSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#24292E',
    marginBottom: 16,
  },
  roleSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292E',
    marginTop: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  infoLabel: {
    fontSize: 14,
    color: '#586069',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#24292E',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 8,
  },
  actionButton: {
    backgroundColor: '#F6F8FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#24292E',
    textAlign: 'center',
    fontWeight: '500',
  },
  adminButton: {
    backgroundColor: '#28A745',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  adminInfo: {
    fontSize: 14,
    color: '#586069',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
  },
});

export default DashboardScreen;