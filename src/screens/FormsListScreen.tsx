import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formResponseService, { Form as FormType } from '../services/FormResponseService';

interface FormsListScreenProps {
  onBack: () => void;
}

const FormsListScreen: React.FC<FormsListScreenProps> = ({ onBack }) => {
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
    } finally {
      setLoading(false);
    }
  };

  const renderForm = ({ item }: { item: FormType }) => (
    <TouchableOpacity style={styles.formCard}>
      <Text style={styles.formTitle}>{item.title}</Text>
      <Text style={styles.formType}>{item.formType}</Text>
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
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formType: {
    fontSize: 14,
    color: '#666',
  },
});

export default FormsListScreen;
