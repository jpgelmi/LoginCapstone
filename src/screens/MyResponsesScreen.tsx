import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formResponseService, { FormResponse, FormResponsesFilter } from '../services/FormResponseService';

interface MyResponsesScreenProps {
  onBack: () => void;
  onViewResponse?: (responseId: string, formTitle: string) => void;
}

const MyResponsesScreen: React.FC<MyResponsesScreenProps> = ({ onBack, onViewResponse }) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Opciones de filtro
  const filterOptions = [
    { key: 'all', label: 'Todas', filter: {} },
    { key: 'draft', label: 'Borradores', filter: { status: 'draft' as const } },
    { key: 'submitted', label: 'Enviadas', filter: { status: 'submitted' as const } },
    { key: 'validated', label: 'Validadas', filter: { status: 'validated' as const } },
    { key: 'injury', label: 'Lesiones', filter: { formType: 'injury' as const } },
    { key: 'wellness', label: 'Bienestar', filter: { formType: 'wellness' as const } },
    { key: 'training-load', label: 'Carga Entrenamiento', filter: { formType: 'training-load' as const } },
  ];

  useEffect(() => {
    console.log('[MOUNT] MyResponses: Componente montado');
    fetchResponses();
  }, []);

    const fetchResponses = async (filters?: FormResponsesFilter) => {
    try {
      console.log('[FETCH] MyResponses: Obteniendo respuestas con filtros:', filters);
      setError(null);

      const data = await formResponseService.getMyResponses(filters);
      setResponses(data);
      
      console.log('[SUCCESS] MyResponses: Respuestas obtenidas:', data.length);
    } catch (error) {
      console.error('[ERROR] MyResponses: Error obteniendo respuestas:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterKey: string) => {
    setSelectedFilter(filterKey);
    const filter = filterOptions.find(f => f.key === filterKey)?.filter || {};
    setLoading(true);
    fetchResponses(filter);
  };

  const onRefresh = () => {
    setRefreshing(true);
    const currentFilter = filterOptions.find(f => f.key === selectedFilter)?.filter || {};
    fetchResponses(currentFilter);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#FF9800';
      case 'submitted': return '#2196F3';
      case 'validated': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'submitted': return 'Enviado';
      case 'validated': return 'Validado';
      default: return status;
    }
  };

  const getFormTypeText = (formType: string) => {
    switch (formType) {
      case 'injury': return 'Lesión';
      case 'wellness': return 'Bienestar';
      case 'training-load': return 'Carga de Entrenamiento';
      default: return formType;
    }
  };

  const handleResponsePress = (response: FormResponse) => {
    if (response.status === 'draft') {
      // Si es borrador, permitir edición
      Alert.alert(
        'Formulario en borrador',
        '¿Qué deseas hacer?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar editando',
            onPress: () => onViewResponse?.(response._id, getFormTitle(response))
          },
          {
            text: 'Ver respuestas',
            onPress: () => showResponseDetails(response)
          }
        ]
      );
    } else {
      // Si ya está enviado, solo mostrar
      showResponseDetails(response);
    }
  };

  const getFormTitle = (response: FormResponse) => {
    if (typeof response.formId === 'object' && (response.formId as any).title) {
      return (response.formId as any).title;
    }
    return `Formulario ${getFormTypeText(typeof response.formId === 'object' ? (response.formId as any).formType : '')}`;
  };

  const showResponseDetails = (response: FormResponse) => {
    const answersText = response.responses?.map(resp => 
      `• ${resp.answer}`
    ).join('\n') || 'Sin respuestas';

    Alert.alert(
      getFormTitle(response),
      `Estado: ${getStatusText(response.status)}\n\n` +
      `Respuestas:\n${answersText}\n\n` +
      `Enviado: ${formatDate(response.submittedAt)}` +
      (response.validatedAt ? `\nValidado: ${formatDate(response.validatedAt)}` : ''),
      [{ text: 'Cerrar' }]
    );
  };

  const renderResponseItem = ({ item }: { item: FormResponse }) => {
    const formTitle = getFormTitle(item);
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <TouchableOpacity
        style={styles.responseCard}
        onPress={() => handleResponsePress(item)}
      >
        <View style={styles.responseHeader}>
          <Text style={styles.responseTitle} numberOfLines={2}>
            {formTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        
        <View style={styles.responseDetails}>
          <Text style={styles.responseDate}>
            Creado: {formatDate(item.submittedAt || new Date().toISOString())}
          </Text>
          
          {item.responses && item.responses.length > 0 && (
            <Text style={styles.responseCount}>
              {item.responses.length} respuesta{item.responses.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {item.status === 'draft' && (
          <View style={styles.draftIndicator}>
            <Text style={styles.draftText}>Toca para continuar</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (option: typeof filterOptions[0]) => {
    const isSelected = selectedFilter === option.key;
    
    return (
      <TouchableOpacity
        key={option.key}
        style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
        onPress={() => handleFilterChange(option.key)}
      >
        <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando mis respuestas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setLoading(true);
            fetchResponses();
          }}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Respuestas</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          renderItem={({ item }) => renderFilterButton(item)}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Lista de respuestas */}
      <FlatList
        data={responses}
        renderItem={renderResponseItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Sin respuestas</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'No has respondido ningún formulario aún'
                : `No tienes respuestas con el filtro seleccionado`
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  responseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  responseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseDate: {
    fontSize: 14,
    color: '#666',
  },
  responseCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  draftIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  draftText: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyResponsesScreen;