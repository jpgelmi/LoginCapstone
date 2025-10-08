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

interface FormQuestionsScreenProps {
  formId: string;
  formTitle: string;
  onBack: () => void;
}

const FormQuestionsScreen: React.FC<FormQuestionsScreenProps> = ({
  formId,
  formTitle,
  onBack,
}) => {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📝 FormQuestions: Componente montado');
    console.log('📝 FormQuestions: Form ID:', formId);
    console.log('📝 FormQuestions: Form Title:', formTitle);
    fetchFormQuestions();
  }, [formId]);

  const fetchFormQuestions = async () => {
    try {
      console.log('🚀 FormQuestions: Iniciando fetch de preguntas del formulario...');
      console.log('📋 FormQuestions: Form ID:', formId);
      
      setLoading(true);
      setError(null);

      const sessionCookie = await authService.extractSessionCookie();
      console.log('🍪 FormQuestions: Session cookie obtenida:', sessionCookie ? 'OK' : 'ERROR');
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      const apiUrl = `https://e0as.me/forms/${formId}/questions`;
      console.log('🌐 FormQuestions: URL del API:', apiUrl);
      console.log('📋 FormQuestions: Headers enviados:', {
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

      console.log('📡 FormQuestions: Response status:', response.status);
      console.log('📡 FormQuestions: Response OK:', response.ok);

      const responseText = await response.text();
      console.log('📄 FormQuestions: Response text length:', responseText.length);
      console.log('📄 FormQuestions: Response text preview:', responseText.substring(0, 300) + '...');
      
      // Guardar respuesta cruda completa
      setRawResponse(responseText);
      
      // Log completo del contenido de la respuesta
      console.log('📋 FormQuestions: CONTENIDO COMPLETO DE LA RESPUESTA:');
      console.log('═'.repeat(80));
      console.log(responseText);
      console.log('═'.repeat(80));
      
      if (!response.ok) {
        console.error('❌ FormQuestions: HTTP Error - Status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        const data = JSON.parse(responseText) as FormQuestionsResponse;
        console.log('✅ FormQuestions: JSON parseado correctamente');
        console.log('📊 FormQuestions: Datos parseados:', {
          message: data.message,
          formId: data.data?.formId,
          title: data.data?.title,
          questionsCount: data.data?.questions ? data.data.questions.length : 0,
          hasQuestions: !!(data.data?.questions && data.data.questions.length > 0)
        });

        // Log detallado de cada pregunta
        if (data.data?.questions) {
          console.log('📝 FormQuestions: DETALLES DE LAS PREGUNTAS:');
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

        setFormData(data.data);
        setQuestions(data.data?.questions || []);
      } catch (parseError) {
        console.error('❌ FormQuestions: Error parsing JSON:', parseError);
        console.error('❌ FormQuestions: Raw response que falló:', responseText);
        setQuestions([]);
      }
    } catch (error) {
      console.error('💥 FormQuestions: Error general:', error);
      console.error('💥 FormQuestions: Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      console.log('🏁 FormQuestions: Fetch completado');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 FormQuestions: Usuario tocó retry');
    fetchFormQuestions();
  };

  const getQuestionTypeIcon = (questionType: string) => {
    const typeIcons: Record<string, string> = {
      'text': '📝',
      'number': '🔢',
      'email': '📧',
      'select': '📋',
      'radio': '⚪',
      'checkbox': '☑️',
      'textarea': '📄',
      'date': '📅',
      'time': '⏰',
      'scale': '📊',
    };
    return typeIcons[questionType] || '❓';
  };

  const getQuestionTypeLabel = (questionType: string) => {
    const typeLabels: Record<string, string> = {
      'text': 'Texto',
      'number': 'Número',
      'email': 'Email',
      'select': 'Selección',
      'radio': 'Opción única',
      'checkbox': 'Múltiple selección',
      'textarea': 'Texto largo',
      'date': 'Fecha',
      'time': 'Hora',
      'scale': 'Escala',
    };
    return typeLabels[questionType] || questionType;
  };

  const renderQuestion = (question: FormQuestion, index: number) => (
    <View key={question._id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.questionInfo}>
          <Text style={styles.questionText}>{question.questionText}</Text>
          <View style={styles.questionMeta}>
            <Text style={styles.questionType}>
              {getQuestionTypeIcon(question.questionType)} {getQuestionTypeLabel(question.questionType)}
            </Text>
            {question.required && (
              <Text style={styles.requiredBadge}>* Requerido</Text>
            )}
          </View>
        </View>
      </View>

      {question.placeholder && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderLabel}>Placeholder:</Text>
          <Text style={styles.placeholderText}>"{question.placeholder}"</Text>
        </View>
      )}

      {question.options && question.options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>Opciones:</Text>
          {question.options.map((option, optIndex) => (
            <View key={optIndex} style={styles.optionItem}>
              <Text style={styles.optionBullet}>•</Text>
              <Text style={styles.optionText}>{option}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.questionFooter}>
        <Text style={styles.questionId}>ID: {question._id.slice(-8)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preguntas</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando preguntas del formulario...</Text>
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
          <Text style={styles.headerTitle}>Error</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Error al cargar preguntas</Text>
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
        <Text style={styles.headerTitle}>Preguntas</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRetry}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info del formulario */}
        <View style={styles.formInfoContainer}>
          <Text style={styles.formInfoTitle}>{formData?.title || formTitle}</Text>
          <Text style={styles.formInfoSubtitle}>
            📝 {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.formInfoId}>ID: {formId}</Text>
        </View>

        {/* Banner de desarrollo */}
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>🚧 MODO DESARROLLO</Text>
          <Text style={styles.devBannerSubtext}>
            Revisa la consola para ver el contenido completo de la respuesta
          </Text>
        </View>

        {/* Lista de preguntas */}
        {questions.length > 0 ? (
          <View style={styles.questionsContainer}>
            <Text style={styles.questionsTitle}>Preguntas del formulario:</Text>
            {questions.map((question, index) => renderQuestion(question, index))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Sin preguntas</Text>
            <Text style={styles.emptyMessage}>
              Este formulario no tiene preguntas configuradas
            </Text>
          </View>
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
  headerSpacer: {
    width: 32,
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
  formInfoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  formInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  formInfoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  formInfoId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  devBanner: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  devBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  devBannerSubtext: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 4,
  },
  questionsContainer: {
    padding: 16,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  questionCard: {
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
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  questionInfo: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  questionType: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  placeholderContainer: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  placeholderLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  placeholderText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  optionsContainer: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  optionsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionBullet: {
    fontSize: 14,
    color: '#3b82f6',
    marginRight: 8,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  questionFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  questionId: {
    fontSize: 12,
    color: '#9ca3af',
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
    paddingHorizontal: 32,
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
  footerSpacer: {
    height: 32,
  },
});

export default FormQuestionsScreen;