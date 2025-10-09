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
import authService from '../services/AuthService';

interface FormQuestion {
  id: string;
  enunciado: string;
  tipo: 'opcionMultiple' | 'numero' | 'escala';
  opciones?: string[];
  requerida: boolean;
  escalaMin?: number;
  escalaMax?: number;
  validaciones?: any;
  userAnswer?: any;
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
  
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formResponseId, setFormResponseId] = useState<string | null>(null);
  const [responses, setResponses] = useState<{[questionId: string]: any}>({});
  const [submitting, setSubmitting] = useState(false);

  // Función para verificar si existe una respuesta existente
  const getExistingFormResponseId = async (): Promise<string | null> => {
    try {
      console.log('🔍 FormResponse: Verificando respuesta existente...');
      
      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No hay cookie de sesión');
      }

      const response = await fetch('https://e0as.me/form-responses/me', {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 FormResponse: Response status para existing:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📄 FormResponse: Respuestas existentes:', data);
        
        // Buscar si hay una respuesta para este formId
        if (data.data && Array.isArray(data.data)) {
          const existingResponse = data.data.find((resp: any) => 
            resp.formId === formId || resp.formId._id === formId
          );
          
          if (existingResponse) {
            console.log('✅ FormResponse: Respuesta existente encontrada:', existingResponse._id);
            return existingResponse._id;
          }
        }
      }
      
      console.log('📝 FormResponse: No hay respuesta existente');
      return null;
    } catch (error) {
      console.log('❌ FormResponse: Error verificando respuesta existente:', error);
      return null;
    }
  };

  // Función para auto-asignar el formulario
  const assignFormToMe = async (): Promise<string | null> => {
    try {
      console.log('🔄 FormResponse: Auto-asignando formulario...');
      
      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No hay cookie de sesión');
      }

      const url = 'https://e0as.me/form-responses/assign/me';
      console.log('🌐 FormResponse: URL para auto-asignación:', url);
      
      const body = { formId };
      console.log('📋 FormResponse: Body:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log('📡 FormResponse: Auto-assign response status:', response.status);
      console.log('📄 FormResponse: Auto-assign response:', responseText);

      if (response.status === 409) {
        // El usuario ya tiene una respuesta asignada
        const errorData = JSON.parse(responseText);
        console.log('❌ FormResponse: Error auto-asignando:', errorData);
        throw new Error(`Error auto-asignando formulario: ${response.status} - ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`Error auto-asignando formulario: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ FormResponse: Formulario auto-asignado:', data);
      return data.data._id;
    } catch (error) {
      console.log('💥 FormResponse: Error en auto-asignación:', error);
      throw error;
    }
  };

  // Función para obtener las preguntas del formulario
  const fetchFormQuestions = async (responseId: string) => {
    try {
      console.log('📋 FormResponse: Obteniendo FormResponse con preguntas...');
      
      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No hay cookie de sesión');
      }

      const url = `https://e0as.me/form-responses/form/${responseId}`;
      console.log('🌐 FormResponse: URL del API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('📡 FormResponse: Response status:', response.status);
      console.log('📄 FormResponse: Response completo:', responseText);

      if (!response.ok) {
        throw new Error(`Error obteniendo preguntas: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ FormResponse: FormResponse obtenido:', data);
      
      if (data.data && data.data.questions) {
        setQuestions(data.data.questions);
        
        // Inicializar respuestas existentes si las hay
        const existingResponses: {[questionId: string]: any} = {};
        data.data.questions.forEach((question: FormQuestion) => {
          if (question.userAnswer !== null && question.userAnswer !== undefined) {
            existingResponses[question.id] = question.userAnswer;
          }
        });
        setResponses(existingResponses);
        
        console.log('📊 FormResponse: Estado actualizado:', {
          questionsCount: data.data.questions.length,
          totalQuestions: data.data.totalQuestions,
          answeredQuestions: data.data.answeredQuestions
        });
      }
    } catch (error) {
      console.log('💥 FormResponse: Error obteniendo preguntas:', error);
      throw error;
    }
  };

  // Función principal de inicialización
  const initializeForm = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 FormResponse: Inicializando formulario...');
      
      // Paso 1: Verificar si ya existe una respuesta
      console.log('📋 FormResponse: Paso 1 - Verificando respuesta existente...');
      let responseId = await getExistingFormResponseId();
      
      if (!responseId) {
        // Paso 2: Si no existe, auto-asignar el formulario
        console.log('📋 FormResponse: Paso 2 - Auto-asignando formulario...');
        responseId = await assignFormToMe();
      } else {
        console.log('✅ FormResponse: Usando respuesta existente:', responseId);
      }
      
      if (responseId) {
        setFormResponseId(responseId);
        
        // Paso 3: Obtener las preguntas
        console.log('📋 FormResponse: Paso 3 - Obteniendo preguntas...');
        await fetchFormQuestions(responseId);
        
        console.log('🎉 FormResponse: Inicialización completada exitosamente');
      } else {
        throw new Error('No se pudo obtener el ID de la respuesta del formulario');
      }
      
    } catch (error) {
      console.log('💥 FormResponse: Error inicializando formulario:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📝 FormResponse: Componente montado');
    console.log('📝 FormResponse: Form ID:', formId);
    console.log('📝 FormResponse: Form Title:', formTitle);
    
    initializeForm();
  }, [formId]);

  // Función para actualizar respuesta de una pregunta
  const updateResponse = (questionId: string, value: any) => {
    console.log('📝 FormResponse: Actualizando respuesta:', { questionId, value });
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Función para renderizar pregunta de opción múltiple
  const renderMultipleChoice = (question: FormQuestion) => {
    const selectedOptions = responses[question.id] || [];
    
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
                  updateResponse(question.id, newSelection);
                } else {
                  // Selección única
                  updateResponse(question.id, option);
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

  // Función para renderizar pregunta numérica
  const renderNumericQuestion = (question: FormQuestion) => {
    const value = responses[question.id] || '';
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.enunciado}</Text>
        {question.requerida && <Text style={styles.requiredText}>* Requerida</Text>}
        
        <TextInput
          style={styles.textInput}
          value={value.toString()}
          onChangeText={(text) => {
            const numValue = parseFloat(text) || 0;
            updateResponse(question.id, numValue);
          }}
          keyboardType="numeric"
          placeholder="Ingresa un número"
        />
      </View>
    );
  };

  // Función para renderizar pregunta de escala
  const renderScaleQuestion = (question: FormQuestion) => {
    const value = responses[question.id] || null;
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
                onPress={() => updateResponse(question.id, scaleValue)}
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
      case 'opcionMultiple':
        return renderMultipleChoice(question);
      case 'numero':
        return renderNumericQuestion(question);
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

  // Función para guardar respuestas
  const saveResponses = async () => {
    if (!formResponseId) {
      Alert.alert('Error', 'No hay ID de respuesta disponible');
      return;
    }

    try {
      setSubmitting(true);
      console.log('💾 FormResponse: Guardando respuestas...');
      
      const sessionCookie = await authService.extractSessionCookie();
      if (!sessionCookie) {
        throw new Error('No hay cookie de sesión');
      }

      // Convertir respuestas al formato esperado por el API
      const formattedResponses = Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const body = {
        responses: formattedResponses
      };

      console.log('📋 FormResponse: Body para guardar:', body);

      const response = await fetch(`https://e0as.me/form-responses/${formResponseId}`, {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log('📡 FormResponse: Save response status:', response.status);
      console.log('📄 FormResponse: Save response:', responseText);

      if (!response.ok) {
        throw new Error(`Error guardando respuestas: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ FormResponse: Respuestas guardadas:', data);
      
      Alert.alert('Éxito', 'Respuestas guardadas correctamente', [
        { text: 'OK', onPress: onBack }
      ]);
      
    } catch (error) {
      console.log('💥 FormResponse: Error guardando respuestas:', error);
      Alert.alert('Error', 'No se pudieron guardar las respuestas');
    } finally {
      setSubmitting(false);
    }
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
          <View key={question.id} style={styles.questionWrapper}>
            <Text style={styles.questionNumber}>Pregunta {index + 1}</Text>
            {renderQuestion(question)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, submitting && styles.saveButtonDisabled]} 
          onPress={saveResponses}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Respuestas</Text>
          )}
        </TouchableOpacity>
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