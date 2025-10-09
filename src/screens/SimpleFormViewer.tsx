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
  _id: string;
  questionText: string;
  questionType: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: any;
}

interface FormQuestionsResponse {
  message: string;
  data: {
    formId: string;
    title: string;
    questions: FormQuestion[];
  };
}

interface SimpleFormViewerProps {
  formId: string;
  formTitle: string;
  onBack: () => void;
}

const SimpleFormViewer: React.FC<SimpleFormViewerProps> = ({
  formId,
  formTitle,
  onBack,
}) => {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  useEffect(() => {
    console.log('📝 SimpleFormViewer: Componente montado');
    console.log('📝 SimpleFormViewer: Form ID:', formId);
    console.log('📝 SimpleFormViewer: Form Title:', formTitle);
    fetchFormQuestions();
  }, [formId]);

  const fetchFormQuestions = async () => {
    try {
      console.log('🚀 SimpleFormViewer: Iniciando fetch de preguntas del formulario...');
      console.log('📋 SimpleFormViewer: Form ID:', formId);
      
      setLoading(true);
      setError(null);

      const sessionCookie = await authService.extractSessionCookie();
      console.log('🍪 SimpleFormViewer: Session cookie obtenida:', sessionCookie ? 'OK' : 'ERROR');
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = `https://e0as.me/forms/${formId}/questions`;
      console.log('🌐 SimpleFormViewer: URL del API:', apiUrl);
      console.log('📋 SimpleFormViewer: Headers enviados:', {
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

      console.log('📡 SimpleFormViewer: Response status:', response.status);
      console.log('📡 SimpleFormViewer: Response OK:', response.ok);

      const responseText = await response.text();
      console.log('📄 SimpleFormViewer: Response text length:', responseText.length);
      console.log('📄 SimpleFormViewer: Response text preview:', responseText.substring(0, 300) + '...');
      
      // Guardar respuesta cruda completa
      setRawResponse(responseText);
      
      // Log completo del contenido de la respuesta
      console.log('📋 SimpleFormViewer: CONTENIDO COMPLETO DE LA RESPUESTA:');
      console.log('═'.repeat(80));
      console.log(responseText);
      console.log('═'.repeat(80));
      
      if (!response.ok) {
        console.error('❌ SimpleFormViewer: HTTP Error - Status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText) as FormQuestionsResponse;
        console.log('✅ SimpleFormViewer: JSON parseado correctamente');
        console.log('📊 SimpleFormViewer: Datos parseados:', {
          message: data.message,
          formId: data.data?.formId,
          title: data.data?.title,
          questionsCount: data.data?.questions ? data.data.questions.length : 0,
          hasQuestions: !!(data.data?.questions && data.data.questions.length > 0)
        });

        // Log detallado de cada pregunta
        if (data.data?.questions) {
          console.log('📝 SimpleFormViewer: DETALLES DE LAS PREGUNTAS:');
          data.data.questions.forEach((question, index) => {
            console.log(`📝 Pregunta ${index + 1}:`, {
              id: question._id,
              text: question.questionText,
              type: question.questionType,
              required: question.required,
              options: question.options,
              placeholder: question.placeholder
            });
          });
        }

        setQuestions(data.data?.questions || []);
      } catch (parseError) {
        console.error('❌ SimpleFormViewer: Error parsing JSON:', parseError);
        console.error('❌ SimpleFormViewer: Raw response que falló:', responseText);
        setQuestions([]);
      }
    } catch (error) {
      console.error('💥 SimpleFormViewer: Error general:', error);
      console.error('💥 SimpleFormViewer: Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      console.log('🏁 SimpleFormViewer: Fetch completado');
      setLoading(false);
    }
  };

  const renderQuestion = (question: FormQuestion) => {
    return (
      <View key={question._id} style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {question.questionText}
          {question.required && <Text style={styles.required}> *</Text>}
        </Text>
        <Text style={styles.questionType}>Tipo: {question.questionType}</Text>
        {question.options && (
          <View>
            <Text style={styles.optionsLabel}>Opciones:</Text>
            {question.options.map((option, index) => (
              <Text key={index} style={styles.option}>• {option}</Text>
            ))}
          </View>
        )}
      </View>
    );
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
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
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
            onPress={fetchFormQuestions}
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
        <Text style={styles.sectionTitle}>Preguntas del Formulario:</Text>
        {questions.length > 0 ? (
          questions.map(renderQuestion)
        ) : (
          <Text style={styles.noQuestions}>No hay preguntas disponibles</Text>
        )}
        
        {rawResponse && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug - Respuesta cruda:</Text>
            <Text style={styles.debugText}>{rawResponse}</Text>
          </View>
        )}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginVertical: 16,
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
    marginBottom: 8,
    lineHeight: 24,
  },
  required: {
    color: '#ef4444',
  },
  questionType: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  option: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginBottom: 2,
  },
  noQuestions: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 32,
  },
  debugContainer: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    marginTop: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
});

export default SimpleFormViewer;