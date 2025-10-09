import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formResponseService, { Form as FormType } from '../services/FormResponseService';

interface FormsListScreenProps {
  onBack: () => void;
  onFormSelected: (formResponseId: string, formTitle: string) => void;
}

const FormsListScreen: React.FC<FormsListScreenProps> = ({ onBack, onFormSelected }) => {
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[MOUNT] FormsListScreen: Componente montado');
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      console.log('[FETCH] FormsListScreen: Obteniendo formularios...');
      const data = await formResponseService.getForms();
      setForms(data);
      console.log('[SUCCESS] FormsListScreen: Formularios obtenidos:', data.length);
    } catch (error) {
      console.error('[ERROR] FormsListScreen: Error obteniendo formularios:', error);
      Alert.alert('Error', 'No se pudieron obtener los formularios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleFormPress = (form: FormType) => {
    // Navegación deshabilitada - solo visualización
    Alert.alert(
      'Información', 
      `Formulario: ${form.title}\nTipo: ${getFormTypeLabel(form.formType)}\nEstado: ${form.status === 'published' ? 'Publicado' : 'Borrador'}`,
      [{ text: 'Cerrar', style: 'default' }]
    );
  };

  const getFormTypeLabel = (formType: string): string => {
    switch (formType.toLowerCase()) {
      case 'injury':
        return 'Lesiones';
      case 'wellness':
        return 'Bienestar';
      case 'training-load':
        return 'Carga de Entrenamiento';
      default:
        return formType;
    }
  };

  const getFormTypeColor = (formType: string): string => {
    switch (formType.toLowerCase()) {
      case 'injury':
        return '#FF6B6B';
      case 'wellness':
        return '#4ECDC4';
      case 'training-load':
        return '#45B7D1';
      default:
        return '#95A5A6';
    }
  };

  const renderForm = ({ item }: { item: FormType }) => (
    <TouchableOpacity 
      style={styles.formCard}
      onPress={() => handleFormPress(item)}
    >
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>{item.title}</Text>
        <View 
          style={[
            styles.formTypeBadge, 
            { backgroundColor: getFormTypeColor(item.formType) }
          ]}
        >
          <Text style={styles.formTypeBadgeText}>
            {getFormTypeLabel(item.formType)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.formStatus}>
        Estado: {item.status === 'published' ? 'Publicado' : 'Borrador'}
      </Text>
      
      <Text style={styles.tapHint}>Toca para ver información del formulario</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formularios</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <FlatList
            data={forms}
            renderItem={renderForm}
            keyExtractor={(item) => item._id}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  formCardLoading: {
    opacity: 0.7,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  formTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formType: {
    fontSize: 14,
    color: '#666',
  },
});

export default FormsListScreen;
