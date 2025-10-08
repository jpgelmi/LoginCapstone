import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../services/AuthService';
import FormQuestionsScreen from './FormQuestionsScreen';

interface Form {
  _id: string;
  title: string;
  formType: string;
  status: string;
  createdAt: string;
}

interface FormsListResponse {
  message: string;
  data: Form[];
}

interface FormsListScreenProps {
  onBack: () => void;
}

const FormsListScreen: React.FC<FormsListScreenProps> = ({ onBack }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  useEffect(() => {
    console.log('📝 FormsListScreen: Componente montado');
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      console.log('🚀 FormsListScreen: Iniciando fetch de formularios...');
      setError(null);

      const sessionCookie = await authService.extractSessionCookie();
      console.log('🍪 FormsListScreen: Session cookie obtenida:', sessionCookie ? 'OK' : 'ERROR');
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = 'https://e0as.me/forms';
      console.log('🌐 FormsListScreen: URL del API:', apiUrl);
      console.log('📋 FormsListScreen: Headers enviados:', {
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

      console.log('📡 FormsListScreen: Response status:', response.status);
      console.log('📡 FormsListScreen: Response OK:', response.ok);

      const responseText = await response.text();
      console.log('📄 FormsListScreen: Response text length:', responseText.length);
      console.log('📄 FormsListScreen: Response text preview:', responseText.substring(0, 200) + '...');
      
      if (!response.ok) {
        console.error('❌ FormsListScreen: HTTP Error - Status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText) as FormsListResponse;
        console.log('✅ FormsListScreen: JSON parseado correctamente');
        console.log('📊 FormsListScreen: Datos parseados:', {
          message: data.message,
          formsCount: data.data ? data.data.length : 0,
          hasData: !!data.data
        });

        setForms(data.data || []);
      } catch (parseError) {
        console.error('❌ FormsListScreen: Error parsing JSON:', parseError);
        setForms([]);
      }
    } catch (error) {
      console.error('💥 FormsListScreen: Error general:', error);
      console.error('💥 FormsListScreen: Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      console.log('🏁 FormsListScreen: Fetch completado');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 FormsListScreen: Usuario solicitó refresh');
    setRefreshing(true);
    fetchForms();
  };

  const handleRetry = () => {
    console.log('🔄 FormsListScreen: Usuario tocó retry');
    setLoading(true);
    fetchForms();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getFormTypeLabel = (formType: string) => {
    const typeLabels: Record<string, string> = {
      'training-load': '🏋️ Carga de Entrenamiento',
      'wellness': '💪 Bienestar',
      'injury': '🩹 Lesión',
      'nutrition': '🥗 Nutrición',
      'recovery': '😴 Recuperación',
    };
    return typeLabels[formType] || `📝 ${formType}`;
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'published': '#10b981',
      'draft': '#f59e0b',
      'archived': '#6b7280',
    };
    return statusColors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'published': 'Publicado',
      'draft': 'Borrador',
      'archived': 'Archivado',
    };
    return statusLabels[status] || status;
  };

  const handleFormPress = (form: Form) => {
    console.log('📝 FormsListScreen: Usuario tocó formulario:', form.title);
    console.log('📝 FormsListScreen: Form ID:', form._id);
    console.log('📝 FormsListScreen: Form Type:', form.formType);
    console.log('📝 FormsListScreen: Navegando a preguntas del formulario...');
    setSelectedForm(form);
  };

  const handleBackFromQuestions = () => {
    console.log('📝 FormsListScreen: Usuario regresó de preguntas del formulario');
    setSelectedForm(null);
  };

  const renderFormItem = ({ item }: { item: Form }) => (
    <TouchableOpacity
      style={styles.formCard}
      onPress={() => handleFormPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{item.title}</Text>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(item.status) }
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.formContent}>
        <View style={styles.formInfo}>
          <Text style={styles.formTypeLabel}>Tipo:</Text>
          <Text style={styles.formTypeValue}>
            {getFormTypeLabel(item.formType)}
          </Text>
        </View>
        
        <View style={styles.formInfo}>
          <Text style={styles.formDateLabel}>Creado:</Text>
          <Text style={styles.formDateValue}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.formFooter}>
        <Text style={styles.formId}>ID: {item._id.slice(-8)}</Text>
        <Text style={styles.formArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>Sin formularios</Text>
      <Text style={styles.emptyMessage}>
        No hay formularios disponibles en este momento
      </Text>
    </View>
  );

  // Si se seleccionó un formulario, mostrar la pantalla de preguntas
  if (selectedForm) {
    return (
      <FormQuestionsScreen
        formId={selectedForm._id}
        formTitle={selectedForm.title}
        onBack={handleBackFromQuestions}
      />
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Formularios</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Obteniendo formularios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Formularios</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Error al cargar formularios</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formularios</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          📝 Formularios disponibles ({forms.length})
        </Text>
        <Text style={styles.infoBannerSubtext}>
          Selecciona un formulario para completar
        </Text>
      </View>

      {/* Lista de formularios */}
      <FlatList
        data={forms}
        renderItem={renderFormItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  headerSpacer: {
    width: 32,
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  infoBanner: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  infoBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 2,
  },
  infoBannerSubtext: {
    fontSize: 14,
    color: '#3730a3',
  },
  listContainer: {
    padding: 16,
  },
  formCard: {
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
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formContent: {
    marginBottom: 12,
  },
  formInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  formTypeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    minWidth: 40,
  },
  formTypeValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  formDateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    minWidth: 40,
  },
  formDateValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  formId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  formArrow: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
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
});

export default FormsListScreen;