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

interface WellnessRecord {
  _id: string;
  userId: string;
  fecha: string;
  calidadSueno: number;
  dolorMuscular: number;
  fatiga: number;
  estres: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  colors?: {
    calidadSueno: string;
    dolorMuscular: string;
    fatiga: string;
    estres: string;
  };
}

interface WellnessRecordsResponse {
  message: string;
  data: WellnessRecord[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface WellnessRecordsScreenProps {
  userId: string;
  userName: string;
  onBack: () => void;
}

const WellnessRecordsScreen: React.FC<WellnessRecordsScreenProps> = ({
  userId,
  userName,
  onBack,
}) => {
  const [wellnessRecords, setWellnessRecords] = useState<WellnessRecord[] | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔧 WellnessRecords: Componente montado con userId:', userId);
    console.log('🔧 WellnessRecords: userName:', userName);
    fetchWellnessRecords();
  }, [userId]);

  const fetchWellnessRecords = async () => {
    try {
      console.log('🚀 WellnessRecords: Iniciando fetch de registros de wellness...');
      console.log('📊 WellnessRecords: UserID:', userId);
      
      setLoading(true);
      setError(null);

      const sessionCookie = await authService.extractSessionCookie();
      console.log('🍪 WellnessRecords: Session cookie obtenida:', sessionCookie ? 'OK' : 'ERROR');
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = `https://e0as.me/wellness/${userId}?limit=30&offset=0`;
      console.log('🌐 WellnessRecords: URL del API:', apiUrl);
      console.log('📋 WellnessRecords: Headers enviados:', {
        'Cookie': sessionCookie.substring(0, 50) + '...',
        'Content-Type': 'application/json'
      });
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 WellnessRecords: Response status:', response.status);
      console.log('📡 WellnessRecords: Response OK:', response.ok);

      const responseText = await response.text();
      console.log('📄 WellnessRecords: Response text length:', responseText.length);
      console.log('📄 WellnessRecords: Response text preview:', responseText.substring(0, 200) + '...');
      
      // Guardar respuesta cruda para mostrar en modo debug
      // Intentar formatear el JSON para mejor legibilidad
      let formattedResponse = responseText;
      try {
        const parsed = JSON.parse(responseText);
        formattedResponse = JSON.stringify(parsed, null, 2);
        console.log('✅ WellnessRecords: JSON parseado correctamente');
        console.log('📊 WellnessRecords: Datos parseados:', {
          message: parsed.message,
          dataLength: parsed.data ? parsed.data.length : 0,
          hasData: !!parsed.data
        });
      } catch (jsonError) {
        console.error('❌ WellnessRecords: Error parseando JSON:', jsonError);
        formattedResponse = responseText;
      }
      setRawResponse(formattedResponse);
      
      if (!response.ok) {
        console.error('❌ WellnessRecords: HTTP Error - Status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText) as WellnessRecordsResponse;
        console.log('🎯 WellnessRecords: Datos procesados:', {
          message: data.message,
          recordsCount: data.data ? data.data.length : 0,
          firstRecord: data.data && data.data.length > 0 ? data.data[0] : null
        });
        setWellnessRecords(data.data || []);
      } catch (parseError) {
        console.error('❌ WellnessRecords: Error parsing final JSON:', parseError);
        setWellnessRecords([]);
      }
    } catch (error) {
      console.error('💥 WellnessRecords: Error general:', error);
      console.error('💥 WellnessRecords: Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      console.log('🏁 WellnessRecords: Fetch completado');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchWellnessRecords();
  };

  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10b981'; // Verde
    if (score >= 6) return '#f59e0b'; // Amarillo
    if (score >= 4) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 8) return '😊';
    if (score >= 6) return '😐';
    if (score >= 4) return '😕';
    return '😞';
  };

  // Componente para mostrar una tarjeta de registro individual
  const WellnessRecordCard: React.FC<{ record: WellnessRecord }> = ({ record }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>{formatDate(record.fecha)}</Text>
        <Text style={styles.recordId}>ID: {record._id.slice(-6)}</Text>
      </View>
      
      <View style={styles.scoresContainer}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>� Calidad Sueño</Text>
          <View style={[
            styles.scoreBadge, 
            { backgroundColor: record.colors?.calidadSueno || getScoreColor(record.calidadSueno) }
          ]}>
            <Text style={styles.scoreValue}>{record.calidadSueno}/10</Text>
          </View>
        </View>
        
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>💪 Dolor Muscular</Text>
          <View style={[
            styles.scoreBadge, 
            { backgroundColor: record.colors?.dolorMuscular || getScoreColor(10 - record.dolorMuscular) }
          ]}>
            <Text style={styles.scoreValue}>{record.dolorMuscular}/10</Text>
          </View>
        </View>
        
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>⚡ Fatiga</Text>
          <View style={[
            styles.scoreBadge, 
            { backgroundColor: record.colors?.fatiga || getScoreColor(10 - record.fatiga) }
          ]}>
            <Text style={styles.scoreValue}>{record.fatiga}/10</Text>
          </View>
        </View>
        
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>� Estrés</Text>
          <View style={[
            styles.scoreBadge, 
            { backgroundColor: record.colors?.estres || getScoreColor(10 - record.estres) }
          ]}>
            <Text style={styles.scoreValue}>{record.estres}/10</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registros Wellness</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Información del usuario */}
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userInfo}>ID: {userId}</Text>
        </View>





        {/* Contenido principal */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Obteniendo registros de wellness...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Error al obtener registros</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Botón para alternar entre vista estructurada y raw data */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={styles.toggleButton} onPress={toggleRawData}>
                <Text style={styles.toggleButtonText}>
                  {showRawData ? '📊 Vista Estructurada' : '🔍 Datos RAW'}
                </Text>
              </TouchableOpacity>
            </View>

            {showRawData ? (
              /* Vista de datos RAW */
              <View style={styles.rawDataContainer}>
                <Text style={styles.rawDataTitle}>🔍 Respuesta RAW de la API</Text>
                <ScrollView style={styles.rawDataScrollView} showsVerticalScrollIndicator={true}>
                  <Text style={styles.rawDataText}>{rawResponse}</Text>
                </ScrollView>
              </View>
            ) : (
              /* Vista estructurada */
              <View style={styles.recordsContainer}>
                <Text style={styles.recordsTitle}>
                  📊 Registros de Wellness ({wellnessRecords?.length || 0})
                </Text>
                
                {wellnessRecords && wellnessRecords.length > 0 ? (
                  wellnessRecords.map((record) => (
                    <WellnessRecordCard key={record._id} record={record} />
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>Sin registros</Text>
                    <Text style={styles.emptyMessage}>
                      Este deportista aún no ha registrado datos de wellness
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
    backgroundColor: '#f8fafc',
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
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  userHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#6b7280',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
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
  rawDataContainer: {
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    maxHeight: 400, // Limitar altura máxima
  },
  rawDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  rawDataScrollView: {
    flex: 1,
  },
  rawDataText: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'monospace',
    lineHeight: 18,
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  recordsContainer: {
    paddingHorizontal: 16,
  },
  recordsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  recordId: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  scoreItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  scoreValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerSpacer: {
    height: 32,
  },
});

export default WellnessRecordsScreen;