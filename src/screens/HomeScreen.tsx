import React, { useState, useEffect } from 'react';
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
import WellnessScreen from './WellnessScreen';
import AthletesListScreen from './AthletesListScreen';
import WellnessRecordsScreen from './WellnessRecordsScreen';
import FormsListScreen from './FormsListScreen';
import MyWellnessRecordsScreen from './MyWellnessRecordsScreen';
import { UserProfile } from '../services/AuthService';



const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [showWellness, setShowWellness] = useState(false);
  const [showAthletes, setShowAthletes] = useState(false);
  const [showWellnessHistory, setShowWellnessHistory] = useState(false);
  const [showForms, setShowForms] = useState(false);

  // Manejar el botón Wellness para atletas
  const handleWellnessPress = () => {
    console.log('🏃‍♂️ HomeScreen: Usuario tocó botón Wellness');
    setShowWellness(true);
  };

  // Manejar el regreso desde Wellness
  const handleWellnessBack = () => {
    console.log('🏃‍♂️ HomeScreen: Usuario regresó de Wellness');
    setShowWellness(false);
  };

  // Manejar el botón Ver Deportistas para médicos
  const handleViewAthletesPress = () => {
    console.log('🏥 HomeScreen: Doctor tocó botón Ver Deportistas');
    setShowAthletes(true);
  };

  // Manejar el regreso desde la pantalla de atletas
  const handleBackFromAthletes = () => {
    console.log('🏥 HomeScreen: Usuario regresó de Lista de Deportistas');
    setShowAthletes(false);
  };

  // Manejar el botón Ver Historial de Wellness para atletas
  const handleWellnessHistoryPress = () => {
    console.log('📊 HomeScreen: Atleta tocó botón Ver Historial de Wellness');
    console.log('📊 HomeScreen: User Email:', user?.email);
    console.log('📊 HomeScreen: User RUT:', user?.rut);
    setShowWellnessHistory(true);
  };

  // Manejar el regreso desde el historial de wellness
  const handleBackFromWellnessHistory = () => {
    console.log('📊 HomeScreen: Usuario regresó del Historial de Wellness');
    setShowWellnessHistory(false);
  };

  // Manejar el botón Formularios para atletas
  const handleFormsPress = () => {
    console.log('📝 HomeScreen: Usuario tocó botón Formularios');
    setShowForms(true);
  };

  // Manejar el regreso desde formularios
  const handleBackFromForms = () => {
    console.log('📝 HomeScreen: Usuario regresó de Formularios');
    setShowForms(false);
  };

  // Manejar selección de formulario
  const handleFormSelected = (formResponseId: string, formTitle: string) => {
    console.log('📝 HomeScreen: Formulario seleccionado:', formTitle, 'ID:', formResponseId);
    // Aquí puedes agregar navegación a la pantalla de respuesta del formulario
  };

  // Renderizar contenido específico según el rol
  const renderRoleSpecificContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'athlete':
        return (
          <View style={styles.athleteContent}>
            <Text style={styles.welcomeText}>
              ¡Bienvenido, {user.firstName}!
            </Text>
            <Text style={styles.subtitleText}>
              Mantente al día con tu bienestar deportivo
            </Text>
            
            <TouchableOpacity 
              style={styles.wellnessButton}
              onPress={handleWellnessPress}
            >
              <View style={styles.wellnessButtonContent}>
                <Text style={styles.wellnessButtonIcon}>💪</Text>
                <View style={styles.wellnessButtonTextContainer}>
                  <Text style={styles.wellnessButtonTitle}>Wellness</Text>
                  <Text style={styles.wellnessButtonSubtitle}>
                    Registra tu estado físico y mental
                  </Text>
                </View>
                <Text style={styles.wellnessButtonArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Botón para ver historial de wellness */}
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={handleWellnessHistoryPress}
            >
              <View style={styles.historyButtonContent}>
                <Text style={styles.historyButtonIcon}>📊</Text>
                <View style={styles.historyButtonTextContainer}>
                  <Text style={styles.historyButtonTitle}>Mis Registros</Text>
                  <Text style={styles.historyButtonSubtitle}>
                    Ve tu historial de wellness
                  </Text>
                </View>
                <Text style={styles.historyButtonArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Botón para formularios */}
            <TouchableOpacity 
              style={styles.formsButton}
              onPress={handleFormsPress}
            >
              <View style={styles.formsButtonContent}>
                <Text style={styles.formsButtonIcon}>📝</Text>
                <View style={styles.formsButtonTextContainer}>
                  <Text style={styles.formsButtonTitle}>Formularios</Text>
                  <Text style={styles.formsButtonSubtitle}>
                    Completa formularios disponibles
                  </Text>
                </View>
                <Text style={styles.formsButtonArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Información rápida del atleta */}
            <View style={styles.quickInfoContainer}>
              <Text style={styles.quickInfoTitle}>Tu información</Text>
              <View style={styles.quickInfoGrid}>
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Disciplina</Text>
                  <Text style={styles.quickInfoValue}>
                    {user.athleteData?.sportDiscipline || 'No especificada'}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Establecimiento</Text>
                  <Text style={styles.quickInfoValue}>
                    {user.athleteData?.establishment || 'No especificado'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'health_team':
      case 'temp_health_team':
        return (
          <View style={styles.doctorContent}>
            <Text style={styles.welcomeText}>
              ¡Bienvenido, Dr. {user.firstName}!
            </Text>
            <Text style={styles.subtitleText}>
              Panel de equipo médico
            </Text>
            
            <TouchableOpacity 
              style={styles.athletesButton}
              onPress={handleViewAthletesPress}
            >
              <View style={styles.athletesButtonContent}>
                <Text style={styles.athletesButtonIcon}>👥</Text>
                <View style={styles.athletesButtonTextContainer}>
                  <Text style={styles.athletesButtonTitle}>Ver Deportistas</Text>
                  <Text style={styles.athletesButtonSubtitle}>
                    Accede a los perfiles y datos de wellness
                  </Text>
                </View>
                <Text style={styles.athletesButtonArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Información rápida del médico */}
            <View style={styles.quickInfoContainer}>
              <Text style={styles.quickInfoTitle}>Información médica</Text>
              <View style={styles.quickInfoGrid}>
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Especialidad</Text>
                  <Text style={styles.quickInfoValue}>
                    Medicina Deportiva
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Rol</Text>
                  <Text style={styles.quickInfoValue}>
                    {user.role === 'health_team' ? 'Equipo Médico' : 'Equipo Médico Temporal'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'trainer':
        return (
          <View style={styles.emptyContent}>
            <Text style={styles.welcomeText}>
              ¡Bienvenido, {user.firstName}!
            </Text>
            <Text style={styles.subtitleText}>
              Panel de entrenador
            </Text>
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyIcon}>🏃‍♂️</Text>
              <Text style={styles.emptyTitle}>Panel de Entrenamiento</Text>
              <Text style={styles.emptySubtitle}>
                Las herramientas de entrenamiento estarán disponibles próximamente
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.emptyContent}>
            <Text style={styles.welcomeText}>
              ¡Bienvenido, {user.firstName}!
            </Text>
            <Text style={styles.subtitleText}>
              Panel principal
            </Text>
          </View>
        );
    }
  };

  // Si se debe mostrar Wellness, renderizar esa pantalla
  if (showWellness) {
    return <WellnessScreen onBack={handleWellnessBack} />;
  }

  if (showAthletes) {
    return <AthletesListScreen onBack={handleBackFromAthletes} />;
  }

  if (showWellnessHistory) {
    return (
      <MyWellnessRecordsScreen onBack={handleBackFromWellnessHistory} />
    );
  }

  if (showForms) {
    return (
      <FormsListScreen onBack={handleBackFromForms} onFormSelected={handleFormSelected} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderRoleSpecificContent()}
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
  
  // Contenido para atletas
  athleteContent: {
    paddingTop: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  wellnessButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wellnessButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  wellnessButtonTextContainer: {
    flex: 1,
  },
  wellnessButtonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  wellnessButtonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  wellnessButtonArrow: {
    fontSize: 20,
    color: '#6b7280',
    marginLeft: 12,
  },
  quickInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickInfoGrid: {
    gap: 12,
  },
  quickInfoItem: {
    paddingVertical: 8,
  },
  quickInfoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },

  // Contenido vacío (médicos y entrenadores)
  emptyContent: {
    paddingTop: 24,
    alignItems: 'center',
  },
  emptyPlaceholder: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para médicos
  doctorContent: {
    paddingTop: 16,
  },
  athletesButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  athletesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  athletesButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  athletesButtonTextContainer: {
    flex: 1,
  },
  athletesButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  athletesButtonSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    lineHeight: 20,
  },
  athletesButtonArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '500',
  },
  // Estilos para el botón de historial de wellness
  historyButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  historyButtonTextContainer: {
    flex: 1,
  },
  historyButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  historyButtonSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
    lineHeight: 20,
  },
  historyButtonArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '500',
  },

  // Estilos para botones deshabilitados
  disabledButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.7,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  disabledTitle: {
    color: '#9ca3af',
  },
  disabledSubtitle: {
    color: '#9ca3af',
  },
  disabledArrow: {
    color: '#9ca3af',
  },
  // Estilos para el botón de formularios
  formsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formsButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  formsButtonTextContainer: {
    flex: 1,
  },
  formsButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  formsButtonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  formsButtonArrow: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default HomeScreen;