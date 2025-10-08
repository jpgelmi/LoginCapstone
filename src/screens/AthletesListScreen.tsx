import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../services/AuthService';
import AthleteDetailScreen from './AthleteDetailScreen';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  cognitoUserId: string;
  fullName: string;
  id: string;
}

interface AthletesResponse {
  data: Athlete[];
}

interface AthletesListScreenProps {
  onBack: () => void;
}

const AthletesListScreen: React.FC<AthletesListScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [showRawData, setShowRawData] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🏃‍♂️ AthletesListScreen: Iniciando llamada a API de atletas...');
      
      // Obtener la cookie de sesión
      const sessionCookie = await authService.extractSessionCookie();
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la cookie de sesión');
      }

      console.log('🍪 AthletesListScreen: Cookie obtenida, realizando petición GET...');

      // Realizar la petición GET
      const response = await fetch('https://e0as.me/athletes', {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      console.log('🌐 AthletesListScreen: Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ AthletesListScreen: Datos recibidos exitosamente:', responseText);
        
        // Guardar respuesta cruda para modo debug
        setRawResponse(responseText);
        
        // Intentar parsear como JSON y extraer deportistas
        try {
          const jsonData: AthletesResponse = JSON.parse(responseText);
          console.log('📊 AthletesListScreen: Datos parseados:', jsonData);
          
          if (jsonData.data && Array.isArray(jsonData.data)) {
            setAthletes(jsonData.data);
            console.log(`👥 AthletesListScreen: ${jsonData.data.length} deportistas encontrados`);
          } else {
            console.warn('⚠️ AthletesListScreen: Formato de respuesta inesperado:', jsonData);
            setError('Formato de respuesta inesperado del servidor');
          }
        } catch (parseError) {
          console.error('💥 AthletesListScreen: Error parseando JSON:', parseError);
          setError('Error procesando respuesta del servidor');
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('❌ AthletesListScreen: Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}\n${errorText}`);
      }

    } catch (error) {
      console.error('💥 AthletesListScreen: Error obteniendo atletas:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchAthletes();
  };

  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  const handleAthletePress = (athlete: Athlete) => {
    console.log('👤 AthletesListScreen: Usuario tocó deportista:', athlete.fullName);
    setSelectedAthlete(athlete);
  };

  const handleBackFromDetail = () => {
    console.log('👤 AthletesListScreen: Usuario regresó del detalle del deportista');
    setSelectedAthlete(null);
  };

  // Componente para la tarjeta de deportista
  const AthleteCard: React.FC<{ athlete: Athlete }> = ({ athlete }) => {
    const getInitials = (firstName: string, lastName: string) => {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
      <TouchableOpacity 
        style={styles.athleteCard} 
        onPress={() => handleAthletePress(athlete)}
        activeOpacity={0.7}
      >
        <View style={styles.athleteCardContent}>
          {/* Avatar con iniciales */}
          <View style={styles.athleteAvatar}>
            <Text style={styles.athleteInitials}>
              {getInitials(athlete.firstName, athlete.lastName)}
            </Text>
          </View>
          
          {/* Información del deportista */}
          <View style={styles.athleteInfo}>
            <Text style={styles.athleteName}>{athlete.fullName}</Text>
            <Text style={styles.athleteEmail}>{athlete.email}</Text>
            <Text style={styles.athleteId}>ID: {athlete.id}</Text>
          </View>
          
          {/* Flecha */}
          <Text style={styles.athleteArrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Si hay un deportista seleccionado, mostrar la pantalla de detalles
  if (selectedAthlete) {
    return (
      <AthleteDetailScreen 
        athlete={selectedAthlete} 
        onBack={handleBackFromDetail} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista de Deportistas</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
          <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Estado de desarrollo */}
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>🚧 MODO DESARROLLO</Text>
          <Text style={styles.devBannerSubtext}>
            Mostrando respuesta cruda de la API para debugging
          </Text>
        </View>

        {/* Información de la API */}
        <View style={styles.apiInfo}>
          <Text style={styles.apiInfoTitle}>📡 Información de la API</Text>
          <Text style={styles.apiInfoText}>
            <Text style={styles.apiInfoLabel}>Endpoint: </Text>
            GET https://e0as.me/athletes
          </Text>
          <Text style={styles.apiInfoText}>
            <Text style={styles.apiInfoLabel}>Headers: </Text>
            Cookie (sesión activa)
          </Text>
        </View>

        {/* Contenido principal */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Obteniendo lista de atletas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Error al obtener atletas</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Contador de deportistas y botón debug */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                👥 {athletes.length} deportista{athletes.length !== 1 ? 's' : ''} encontrado{athletes.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity style={styles.debugButton} onPress={toggleRawData}>
                <Text style={styles.debugButtonText}>
                  {showRawData ? '📱 Ver Tarjetas' : '🔍 Ver Debug'}
                </Text>
              </TouchableOpacity>
            </View>

            {showRawData ? (
              /* Modo debug - mostrar respuesta cruda */
              <View style={styles.responseContainer}>
                <Text style={styles.responseTitle}>📋 Respuesta cruda de la API</Text>
                <ScrollView 
                  style={styles.responseScroll} 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.responseText}>{rawResponse}</Text>
                </ScrollView>
              </View>
            ) : (
              /* Modo normal - mostrar tarjetas */
              <View style={styles.athletesContainer}>
                {athletes.length > 0 ? (
                  athletes.map((athlete) => (
                    <AthleteCard key={athlete._id} athlete={athlete} />
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>👤</Text>
                    <Text style={styles.emptyTitle}>No hay deportistas</Text>
                    <Text style={styles.emptyMessage}>
                      No se encontraron deportistas asignados a tu perfil médico.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  devBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  devBannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
    textAlign: 'center',
  },
  devBannerSubtext: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  apiInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  apiInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  apiInfoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  apiInfoLabel: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f87171',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  responseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  responseScroll: {
    maxHeight: 400,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  responseText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Courier New', // Fuente monoespaciada para JSON
    lineHeight: 16,
  },
  footerSpacer: {
    height: 32,
  },
  // Estilos para las estadísticas y debug
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  debugButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  debugButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Estilos para el contenedor de deportistas
  athletesContainer: {
    marginBottom: 16,
  },
  // Estilos para las tarjetas de deportistas
  athleteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
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
  athleteCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  athleteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  athleteInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  athleteEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  athleteId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  athleteArrow: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Estilos para estado vacío
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AthletesListScreen;