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
import WellnessRecordsScreen from './WellnessRecordsScreen';

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  cognitoUserId: string;
  fullName: string;
  id: string;
}

interface AthleteBasicInfo {
  userId: string;
  fullName: string;
  rut: string;
  email: string;
  phone: string;
  birthDate: string;
  age: number;
  biologicalSex: string;
  establishment: string;
  sportDiscipline: string;
  professionalAspiration: string;
  competitiveLevel: string;
}

interface EppStatus {
  status: string;
  isUpToDate: boolean;
}

interface AthleteDetailResponse {
  success: boolean;
  data: {
    basicInfo: AthleteBasicInfo;
    eppStatus: EppStatus;
    medicalHistory: any;
  };
}

interface AthleteDetailScreenProps {
  athlete: Athlete;
  onBack: () => void;
}

const AthleteDetailScreen: React.FC<AthleteDetailScreenProps> = ({ athlete, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [athleteDetailData, setAthleteDetailData] = useState<AthleteDetailResponse | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [showRawData, setShowRawData] = useState(false);
  const [error, setError] = useState<string>('');
  const [showWellnessRecords, setShowWellnessRecords] = useState(false);

  useEffect(() => {
    fetchAthleteDetail();
  }, []);

  const fetchAthleteDetail = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('👤 AthleteDetailScreen: Obteniendo detalles del deportista...', {
        athleteId: athlete._id,
        userId: athlete.id,
        cognitoUserId: athlete.cognitoUserId,
        fullName: athlete.fullName
      });
      
      // Obtener la cookie de sesión
      const sessionCookie = await authService.extractSessionCookie();
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la cookie de sesión');
      }

      console.log('🍪 AthleteDetailScreen: Cookie obtenida, realizando petición GET...');

      // Construir la URL con el id del usuario
      const url = `https://e0as.me/dashboard/${athlete.id}/athlete`;
      console.log('🌐 AthleteDetailScreen: URL construida:', url);

      // Realizar la petición GET
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      });

      console.log('📡 AthleteDetailScreen: Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ AthleteDetailScreen: Datos del deportista recibidos exitosamente:', responseText);
        
        // Guardar respuesta cruda para modo debug
        setRawResponse(responseText);
        
        // Intentar parsear como JSON y estructurar datos
        try {
          const jsonData: AthleteDetailResponse = JSON.parse(responseText);
          console.log('📊 AthleteDetailScreen: Datos parseados:', jsonData);
          
          if (jsonData.success && jsonData.data) {
            setAthleteDetailData(jsonData);
            console.log('👤 AthleteDetailScreen: Información del deportista procesada correctamente');
          } else {
            console.warn('⚠️ AthleteDetailScreen: Respuesta no exitosa:', jsonData);
            setError('La respuesta del servidor indica un error');
          }
        } catch (parseError) {
          console.error('💥 AthleteDetailScreen: Error parseando JSON:', parseError);
          setError('Error procesando respuesta del servidor');
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('❌ AthleteDetailScreen: Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}\n${errorText}`);
      }

    } catch (error) {
      console.error('💥 AthleteDetailScreen: Error obteniendo detalles del deportista:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchAthleteDetail();
  };

  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificado';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (isUpToDate: boolean) => {
    return isUpToDate ? '#10b981' : '#ef4444';
  };

  const getStatusText = (isUpToDate: boolean) => {
    return isUpToDate ? 'Al día' : 'Pendiente';
  };

  // Componente para mostrar información básica
  const BasicInfoCard: React.FC<{ basicInfo: AthleteBasicInfo }> = ({ basicInfo }) => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>📋 Información Básica</Text>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>RUT</Text>
          <Text style={styles.infoValue}>{basicInfo.rut || 'No especificado'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Edad</Text>
          <Text style={styles.infoValue}>{basicInfo.age} años</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Fecha Nacimiento</Text>
          <Text style={styles.infoValue}>{formatDate(basicInfo.birthDate)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Sexo Biológico</Text>
          <Text style={styles.infoValue}>{basicInfo.biologicalSex || 'No especificado'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Teléfono</Text>
          <Text style={styles.infoValue}>{basicInfo.phone || 'No especificado'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Establecimiento</Text>
          <Text style={styles.infoValue}>{basicInfo.establishment || 'No especificado'}</Text>
        </View>
      </View>
    </View>
  );

  // Componente para mostrar información deportiva
  const SportsInfoCard: React.FC<{ basicInfo: AthleteBasicInfo }> = ({ basicInfo }) => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>🏃‍♂️ Información Deportiva</Text>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Disciplina</Text>
          <Text style={styles.infoValue}>{basicInfo.sportDiscipline || 'No especificada'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nivel Competitivo</Text>
          <Text style={styles.infoValue}>{basicInfo.competitiveLevel || 'No especificado'}</Text>
        </View>
        <View style={styles.infoItemFull}>
          <Text style={styles.infoLabel}>Aspiración Profesional</Text>
          <Text style={styles.infoValue}>{basicInfo.professionalAspiration || 'No especificada'}</Text>
        </View>
      </View>
    </View>
  );

  // Componente para mostrar estado EPP
  const EppStatusCard: React.FC<{ eppStatus: EppStatus }> = ({ eppStatus }) => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>🏥 Estado EPP</Text>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Estado</Text>
          <Text style={styles.statusValue}>{eppStatus.status || 'No especificado'}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Actualización</Text>
          <View style={styles.statusBadge}>
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: getStatusColor(eppStatus.isUpToDate) }
              ]} 
            />
            <Text 
              style={[
                styles.statusBadgeText,
                { color: getStatusColor(eppStatus.isUpToDate) }
              ]}
            >
              {getStatusText(eppStatus.isUpToDate)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Si está mostrando wellness records, renderizar esa pantalla
  if (showWellnessRecords) {
    return (
      <WellnessRecordsScreen
        userId={athlete.id}
        userName={athlete.fullName}
        onBack={() => setShowWellnessRecords(false)}
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
        <Text style={styles.headerTitle}>Detalle Deportista</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Información del deportista */}
        <View style={styles.athleteHeader}>
          <View style={styles.athleteAvatar}>
            <Text style={styles.athleteInitials}>
              {getInitials(athlete.firstName, athlete.lastName)}
            </Text>
          </View>
          <View style={styles.athleteHeaderInfo}>
            <Text style={styles.athleteName}>{athlete.fullName}</Text>
            <Text style={styles.athleteEmail}>{athlete.email}</Text>
            <Text style={styles.athleteId}>ID: {athlete.id}</Text>
          </View>
        </View>

        {/* Botón Ver registros de wellness */}
        <View style={styles.wellnessButtonContainer}>
          <TouchableOpacity style={styles.wellnessButton} onPress={() => {
            console.log('🎯 AthleteDetail: Navegando a registros de wellness');
            console.log('🎯 AthleteDetail: Athlete ID:', athlete.id);
            console.log('🎯 AthleteDetail: Athlete Name:', athlete.fullName);
            setShowWellnessRecords(true);
          }}>
            <Text style={styles.wellnessButtonIcon}>📊</Text>
            <Text style={styles.wellnessButtonText}>Ver registros de wellness</Text>
            <Text style={styles.wellnessButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>





        {/* Contenido principal */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Obteniendo detalles del deportista...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Error al obtener detalles</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : athleteDetailData ? (
          <>
            {/* Botón para alternar entre vista estructurada y raw data */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={styles.toggleButton} onPress={toggleRawData}>
                <Text style={styles.toggleButtonText}>
                  {showRawData ? '📱 Vista Estructurada' : '🔍 Datos RAW'}
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
              /* Vista estructurada */
              <>
                <BasicInfoCard basicInfo={athleteDetailData.data.basicInfo} />
                <SportsInfoCard basicInfo={athleteDetailData.data.basicInfo} />
                <EppStatusCard eppStatus={athleteDetailData.data.eppStatus} />
                
                {/* Historial médico */}
                {athleteDetailData.data.medicalHistory && (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseTitle}>🏥 Historial Médico</Text>
                    <ScrollView 
                      style={styles.responseScroll} 
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      <Text style={styles.responseText}>
                        {JSON.stringify(athleteDetailData.data.medicalHistory, null, 2)}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </>
        ) : null}

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
    fontSize: 16,
    color: '#3b82f6',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Header del deportista
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  athleteAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  athleteInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  athleteHeaderInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  athleteEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  athleteId: {
    fontSize: 14,
    color: '#9ca3af',
  },

  // Estados de carga
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
  // Estados de error
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
  // Respuesta de la API
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
    maxHeight: 500,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  responseText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Courier New',
    lineHeight: 16,
  },
  footerSpacer: {
    height: 32,
  },
  // Botón de alternancia
  toggleContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#6b7280',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Tarjetas de información
  infoCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  infoItemFull: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  // Estado EPP
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Botón de wellness
  wellnessButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  wellnessButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wellnessButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  wellnessButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wellnessButtonArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AthleteDetailScreen;