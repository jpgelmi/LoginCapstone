import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formResponseService, { FormQuestion, FormResponse } from '../services/FormResponseService';

interface FormResponseScreenProps {
  formId: string;
  formTitle: string;
  onBack: () => void;
}

const FormResponseScreen: React.FC<FormResponseScreenProps> = ({
  formId,
  formTitle,
  onBack,
}) => {
  
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  const [responses, setResponses] = useState<{[questionId: string]: any}>({});
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Función principal de inicialización usando el nuevo servicio
  const initializeForm = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('� FormResponse: Inicializando formulario con nuevo servicio...');
      
      // Usar el flujo completo del servicio
      const { formResponse: response, isNew } = await formResponseService.getOrCreateFormResponse(formId);
      
      console.log('✅ FormResponse: Formulario inicializado:', {
        responseId: response._id,
        isNew,
        questionsCount: response.questions?.length
      });
      
      setFormResponse(response);
      setQuestions(response.questions || []);
      
      // Inicializar respuestas existentes si las hay
      const existingResponses: {[questionId: string]: any} = {};
      response.responses?.forEach(resp => {
        existingResponses[resp.questionId] = resp.answer;
      });
      setResponses(existingResponses);
      
    } catch (error) {
      console.error('[ERROR] FormResponse: Error inicializando formulario:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[MOUNT] FormResponse: Componente montado');
    console.log('[MOUNT] FormResponse: Form ID:', formId);
    console.log('[MOUNT] FormResponse: Form Title:', formTitle);
    
    initializeForm();
  }, [formId]);

  // Función para actualizar respuesta de una pregunta
  const updateResponse = (questionId: string, value: any) => {
    console.log('[UPDATE] FormResponse: Actualizando respuesta:', { questionId, value });
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Función para renderizar pregunta de texto
  const renderTextQuestion = (question: FormQuestion) => {
    const value = responses[question._id] || '';
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.enunciado}</Text>
        {question.requerida && <Text style={styles.requiredText}>* Requerida</Text>}
        
        <TextInput
          style={styles.textInput}
          value={value.toString()}
          onChangeText={(text) => updateResponse(question._id, text)}
          placeholder="Escribe tu respuesta"
          multiline
        />
      </View>
    );
  };

  // Función para renderizar pregunta numérica
  const renderNumericQuestion = (question: FormQuestion) => {
    const value = responses[question._id] || '';
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.enunciado}</Text>
        {question.requerida && <Text style={styles.requiredText}>* Requerida</Text>}
        
        <TextInput
          style={styles.textInput}
          value={value.toString()}
          onChangeText={(text) => {
            const numValue = parseFloat(text) || 0;
            updateResponse(question._id, numValue);
          }}
          keyboardType="numeric"
          placeholder="Ingresa un número"
        />
      </View>
    );
  };

  // Función para renderizar pregunta de opción múltiple
  const renderMultipleChoice = (question: FormQuestion) => {
    const selectedOptions = responses[question._id] || [];
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.enunciado}</Text>
        {question.requerida && <Text style={styles.requiredText}>* Requerida</Text>}
        
        {question.opciones?.map((option, index) => {
          const isSelected = Array.isArray(selectedOptions) ? 
            selectedOptions.includes(option) : selectedOptions === option;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, isSelected && styles.optionSelected]}
              onPress={() => {
                if (Array.isArray(selectedOptions)) {
                  // Múltiple selección
                  const newSelection = isSelected
                    ? selectedOptions.filter(item => item !== option)
                    : [...selectedOptions, option];
                  updateResponse(question._id, newSelection);
                } else {
                  // Selección única
                  updateResponse(question._id, option);
                }
              }}
            >
              <Text style={[styles.optionText, isSelected && styles.optionSelectedText]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Función para renderizar pregunta de escala
  const renderScaleQuestion = (question: FormQuestion) => {
    const value = responses[question._id] || null;
    const min = question.escalaMin || 1;
    const max = question.escalaMax || 10;
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.enunciado}</Text>
        {question.requerida && <Text style={styles.requiredText}>* Requerida</Text>}
        
        <View style={styles.scaleContainer}>
          {Array.from({ length: max - min + 1 }, (_, i) => {
            const scaleValue = min + i;
            const isSelected = value === scaleValue;
            
            return (
              <TouchableOpacity
                key={scaleValue}
                style={[styles.scaleButton, isSelected && styles.scaleSelected]}
                onPress={() => updateResponse(question._id, scaleValue)}
              >
                <Text style={[styles.scaleText, isSelected && styles.scaleSelectedText]}>
                  {scaleValue}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Función para renderizar una pregunta según su tipo
  const renderQuestion = (question: FormQuestion) => {
    switch (question.tipo) {
      case 'texto':
        return renderTextQuestion(question);
      case 'numero':
        return renderNumericQuestion(question);
      case 'opcionMultiple':
        return renderMultipleChoice(question);
      case 'escala':
        return renderScaleQuestion(question);
      default:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              Tipo de pregunta no soportado: {question.tipo}
            </Text>
          </View>
        );
    }
  };

  // Función para guardar respuestas como borrador
  const saveResponses = async () => {
    if (!formResponse) {
      Alert.alert('Error', 'No hay respuesta de formulario disponible');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 FormResponse: Guardando respuestas como borrador...');
      
      // Convertir respuestas al formato esperado por el API
      const formattedResponses = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      await formResponseService.saveFormResponses(
        formResponse.formId,
        formResponse._id,
        formattedResponses,
        'draft'
      );
      
      Alert.alert('Éxito', 'Respuestas guardadas como borrador');
      
    } catch (error) {
      console.error('� FormResponse: Error guardando respuestas:', error);
      Alert.alert('Error', 'No se pudieron guardar las respuestas');
    } finally {
      setSaving(false);
    }
  };

  // Función para enviar formulario completado
  const submitForm = async () => {
    if (!formResponse) {
      Alert.alert('Error', 'No hay respuesta de formulario disponible');
      return;
    }

    // Verificar preguntas requeridas
    const requiredQuestions = questions.filter(q => q.requerida);
    const missingAnswers = requiredQuestions.filter(q => !responses[q._id]);
    
    if (missingAnswers.length > 0) {
      Alert.alert(
        'Preguntas requeridas', 
        `Faltan respuestas para ${missingAnswers.length} pregunta(s) requerida(s)`
      );
      return;
    }

    Alert.alert(
      'Enviar formulario',
      '¿Estás seguro de que quieres enviar el formulario? Una vez enviado no podrás modificar las respuestas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar',
          style: 'default',
          onPress: async () => {
            try {
              setSubmitting(true);
              console.log('� FormResponse: Enviando formulario...');
              
              // Primero guardar las respuestas actuales
              const formattedResponses = Object.entries(responses).map(([questionId, answer]) => ({
                questionId,
                answer
              }));

              await formResponseService.saveFormResponses(
                formResponse.formId,
                formResponse._id,
                formattedResponses,
                'draft'
              );
              
              // Luego enviar el formulario
              await formResponseService.submitForm(formResponse._id);
              
              Alert.alert('Éxito', 'Formulario enviado correctamente', [
                { text: 'OK', onPress: onBack }
              ]);
              
            } catch (error) {
              console.error('💥 FormResponse: Error enviando formulario:', error);
              Alert.alert('Error', 'No se pudo enviar el formulario');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando formulario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeForm}>
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
        <Text style={styles.title}>{formTitle}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {questions.map((question, index) => (
          <View key={question._id} style={styles.questionWrapper}>
            <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
            {renderQuestion(question)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.draftButton, saving && styles.buttonDisabled]} 
            onPress={saveResponses}
            disabled={saving || submitting}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.draftButtonText}>Guardar Borrador</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.buttonDisabled]} 
            onPress={submitForm}
            disabled={submitting || saving}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Formulario</Text>
            )}
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  questionWrapper: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  requiredText: {
    fontSize: 12,
    color: '#ff4444',
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionSelectedText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scaleButton: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 40,
    alignItems: 'center',
  },
  scaleSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  scaleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  scaleSelectedText: {
    color: '#2196F3',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  draftButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  draftButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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

export default FormResponseScreen;