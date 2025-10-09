import React, { useState, useEffect } from 'react';
import {
  View,
      // Paso 1: Auto-asignarse el formulario (o usar el existente)
      console.log('📋 FormResponse: Paso 1 - Auto-asignando formulario...');
      const formResponseId = await assignFormToMe();
      
      if (formResponseId) {
        // Paso 2: Obtener las preguntas del FormResponse
        console.log('📋 FormResponse: Paso 2 - Obteniendo preguntas...');
        await fetchFormResponse(formResponseId);
      } StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import authService from '../services/AuthService';

interface FormQuestion {
  id: string;
  enunciado: string;
  tipo: string;
  requerida: boolean;
  opciones?: string[];
  escalaMin?: number;
  escalaMax?: number;
  ayuda?: string;
  validaciones?: any;
  userAnswer?: any;
}

interface FormResponse {
  _id: string;
  formId: string;
  status: 'draft' | 'submitted' | 'reviewed';
  responses: Array<{
    questionId: string;
    value: any;
  }>;
  questions: FormQuestion[];
}

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
  const [formResponse, setFormResponse] = useState<FormResponse | null>(null);
  const [responses, setResponses] = useState<{ [questionId: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📝 FormResponse: Componente montado');
    console.log('📝 FormResponse: Form ID:', formId);
    console.log('📝 FormResponse: Form Title:', formTitle);
    initializeForm();
  }, [formId]);

  const initializeForm = async () => {
    try {
      console.log('🚀 FormResponse: Inicializando formulario...');
      setLoading(true);
      setError(null);

      // Paso 1: Auto-asignarse el formulario
      console.log('📋 FormResponse: Paso 1 - Auto-asignando formulario...');
      const formResponseId = await assignFormToMe();
      
      if (formResponseId) {
        // Paso 2: Obtener las preguntas del FormResponse
        console.log('� FormResponse: Paso 2 - Obteniendo preguntas...');
        await fetchFormResponse(formResponseId);
      }
    } catch (error: any) {
      console.error('💥 FormResponse: Error inicializando formulario:', error);
      setError(error.message || 'Error cargando el formulario');
    } finally {
      setLoading(false);
    }
  };

  const assignFormToMe = async (): Promise<string | null> => {
    try {
      console.log('🔄 FormResponse: Auto-asignando formulario...');
      
      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = 'https://e0as.me/form-responses/assign/me';
      console.log('🌐 FormResponse: URL para auto-asignación:', apiUrl);
      console.log('📋 FormResponse: Body:', { formId });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formId
        }),
      });

      console.log('📡 FormResponse: Auto-assign response status:', response.status);

      const responseText = await response.text();
      console.log('📄 FormResponse: Auto-assign response:', responseText);

      if (!response.ok) {
        console.error('❌ FormResponse: Error auto-asignando:', responseText);
        throw new Error(`Error auto-asignando formulario: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ FormResponse: Formulario auto-asignado:', result);
      
      return result.data?._id || result._id;
    } catch (error: any) {
      console.error('💥 FormResponse: Error en auto-asignación:', error);
      throw error;
    }
  };

  const fetchFormResponse = async (formResponseId: string) => {
    try {
      console.log('� FormResponse: Obteniendo FormResponse con preguntas...');
      
      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = `https://e0as.me/form-responses/form/${formResponseId}`;
      console.log('🌐 FormResponse: URL del API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FormResponse: Response status:', response.status);

      const responseText = await response.text();
      console.log('📄 FormResponse: Response completo:', responseText);

      if (!response.ok) {
        console.error('❌ FormResponse: Error:', responseText);
        throw new Error(`Error obteniendo formulario: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ FormResponse: FormResponse obtenido:', result);
      
      const formResponseData = result.data || result;
      
      // Crear un FormResponse con la estructura correcta
      const processedFormResponse: FormResponse = {
        _id: formResponseData.formResponse?.id || formResponseData.id,
        formId: formResponseData.formResponse?.formId?._id || formResponseData.formId,
        status: formResponseData.formResponse?.status || formResponseData.status || 'draft',
        responses: formResponseData.formResponse?.responses || formResponseData.responses || [],
        questions: formResponseData.questions || []
      };
      
      setFormResponse(processedFormResponse);
      
      // Inicializar respuestas existentes si las hay
      if (processedFormResponse.responses && processedFormResponse.responses.length > 0) {
        const existingResponses: { [questionId: string]: any } = {};
        processedFormResponse.responses.forEach((response: any) => {
          existingResponses[response.questionId] = response.value;
        });
        setResponses(existingResponses);
      }
    } catch (error: any) {
      console.error('💥 FormResponse: Error obteniendo FormResponse:', error);
      throw error;
    }
  };



  const saveAsDraft = async () => {
    if (!formResponse) {
      console.log('❌ FormResponse: No hay FormResponse para guardar');
      return;
    }

    try {
      console.log('🚀 FormResponse: Guardando respuestas...');
      setSaving(true);

      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      // Convertir respuestas al formato esperado por la API
      const formattedResponses = Object.entries(responses).map(([questionId, value]) => ({
        questionId,
        value
      }));

      const apiUrl = 'https://e0as.me/form-responses';
      console.log('🌐 FormResponse: URL para guardar respuestas:', apiUrl);
      console.log('📋 FormResponse: FormResponse ID:', formResponse._id);
      console.log('📋 FormResponse: Respuestas a guardar:', formattedResponses);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formResponseId: formResponse._id,
          responses: formattedResponses
        }),
      });

      console.log('📡 FormResponse: Save responses status:', response.status);

      const responseText = await response.text();
      console.log('📄 FormResponse: Save responses result:', responseText);

      if (!response.ok) {
        console.error('❌ FormResponse: Error guardando respuestas:', responseText);
        throw new Error(`Error guardando respuestas: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ FormResponse: Respuestas guardadas:', result);
      
      Alert.alert('Éxito', 'Respuestas guardadas correctamente');
    } catch (error: any) {
      console.error('💥 FormResponse: Error guardando respuestas:', error);
      Alert.alert('Error', error.message || 'Error guardando las respuestas');
    } finally {
      setSaving(false);
    }
  };

  const submitForm = async () => {
    if (!formResponse) {
      console.log('❌ FormResponse: No hay FormResponse para enviar');
      return;
    }

    try {
      console.log('🚀 FormResponse: Enviando formulario...');
      setSubmitting(true);

      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = `https://e0as.me/form-responses/response/${formResponse._id}/submit`;
      console.log('🌐 FormResponse: URL para enviar formulario:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FormResponse: Submit response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ FormResponse: Error enviando formulario:', errorText);
        throw new Error(`Error enviando formulario: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ FormResponse: Formulario enviado:', result);
      
      Alert.alert(
        'Formulario Enviado',
        'Tu formulario ha sido enviado correctamente y está esperando validación médica.',
        [
          {
            text: 'OK',
            onPress: onBack
          }
        ]
      );
    } catch (error: any) {
      console.error('💥 FormResponse: Error enviando formulario:', error);
      Alert.alert('Error', error.message || 'Error enviando el formulario');
    } finally {
      setSubmitting(false);
    }
  };

  const updateResponse = (questionId: string, answer: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const renderQuestion = (question: FormQuestion) => {
    const currentAnswer = responses[question.id] || '';
    const currentMultipleAnswers = Array.isArray(responses[question.id]) ? responses[question.id] : [];

    return (
      <View key={question.id} style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {question.enunciado}
          {question.requerida && <Text style={styles.required}> *</Text>}
        </Text>
        
        {question.ayuda && (
          <Text style={styles.helpText}>{question.ayuda}</Text>
        )}
        
        {question.tipo === 'texto' && (
          <TextInput
            style={styles.textInput}
            value={currentAnswer}
            onChangeText={(text) => updateResponse(question.id, text)}
            placeholder="Escribe tu respuesta..."
            multiline={true}
            numberOfLines={3}
          />
        )}

        {question.tipo === 'numero' && (
          <TextInput
            style={styles.textInput}
            value={currentAnswer ? currentAnswer.toString() : ''}
            onChangeText={(text) => updateResponse(question.id, text)}
            placeholder="Ingresa un número..."
            keyboardType="numeric"
          />
        )}

        {question.tipo === 'opcionMultiple' && question.opciones && (
          <View style={styles.optionsContainer}>
            {question.opciones.map((option: string, index: number) => {
              const isSelected = currentMultipleAnswers.includes(option);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    isSelected && styles.selectedOption
                  ]}
                  onPress={() => handleMultipleOptionPress(question.id, option)}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {question.tipo === 'escala' && (
          <View style={styles.scaleContainer}>
            <Text style={styles.scaleLabel}>
              {question.escalaMin} (Mínimo) - {question.escalaMax} (Máximo)
            </Text>
            <View style={styles.scaleOptions}>
              {Array.from({ length: (question.escalaMax || 10) - (question.escalaMin || 1) + 1 }, (_, i) => {
                const value = (question.escalaMin || 1) + i;
                const isSelected = currentAnswer == value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.scaleOption,
                      isSelected && styles.selectedScaleOption
                    ]}
                    onPress={() => updateResponse(question.id, value)}
                  >
                    <Text style={[
                      styles.scaleOptionText,
                      isSelected && styles.selectedScaleOptionText
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleMultipleOptionPress = (questionId: string, option: string) => {
    const currentAnswers = Array.isArray(responses[questionId]) ? responses[questionId] : [];
    let newAnswers;
    
    if (currentAnswers.includes(option)) {
      // Remover la opción si ya está seleccionada
      newAnswers = currentAnswers.filter((item: string) => item !== option);
    } else {
      // Agregar la opción si no está seleccionada
      newAnswers = [...currentAnswers, option];
    }
    
    updateResponse(questionId, newAnswers);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{formTitle}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando formulario...</Text>
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
          <Text style={styles.headerTitle}>{formTitle}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeForm}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
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
        <Text style={styles.headerTitle}>{formTitle}</Text>
      </View>

      <ScrollView style={styles.content}>
        {formResponse?.questions?.map(renderQuestion)}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.draftButton, saving && styles.disabledButton]}
          onPress={saveAsDraft}
          disabled={saving}
        >
          <Text style={styles.draftButtonText}>
            {saving ? 'Guardando...' : 'Guardar Borrador'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={submitForm}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Enviando...' : 'Enviar Formulario'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    color: '#ffffff',
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedOptionText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 16,
  },
  scaleContainer: {
    gap: 8,
  },
  scaleLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  scaleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedScaleOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  scaleOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedScaleOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default FormResponseScreen;