import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBookStore } from '../../store/book.store';
import api from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const GENRES = [
  { label: '📖 Roman', value: 'ROMAN' },
  { label: '📝 Poésie', value: 'POESIE' },
  { label: '🎭 Théâtre', value: 'THEATRE' },
  { label: '📜 Histoire', value: 'HISTOIRE' },
  { label: '🚀 Science-Fiction', value: 'SCIENCE_FICTION' },
  { label: '🧙 Fantastique', value: 'FANTASTIQUE' },
  { label: '🔍 Polar', value: 'POLAR' },
  { label: '🗺️ Aventure', value: 'AVENTURE' },
  { label: '👤 Biographie', value: 'BIOGRAPHIE' },
  { label: '📚 Essai', value: 'ESSAI' },
  { label: '🧠 Philosophie', value: 'PHILOSOPHIE' },
  { label: '🧒 Jeunesse', value: 'JEUNESSE' },
  { label: '🖼️ Bande dessinée', value: 'BANDE_DESSINEE' },
  { label: '🎨 Art', value: 'ART' },
  { label: '🍳 Cuisine', value: 'CUISINE' },
  { label: '✈️ Voyage', value: 'VOYAGE' },
  { label: '⚽ Sport', value: 'SPORT' },
  { label: '💪 Santé', value: 'SANTE' },
  { label: '🕌 Religion', value: 'RELIGION' },
  { label: '📦 Autre', value: 'AUTRE' },
];

const LANGUAGES = [
  { label: '🇫🇷 Français', value: 'FRANCAIS' },
  { label: '🇬🇧 Anglais', value: 'ANGLAIS' },
  { label: '🇸🇦 Arabe', value: 'ARABE' },
  { label: '🇪🇸 Espagnol', value: 'ESPAGNOL' },
  { label: '🇩🇪 Allemand', value: 'ALLEMAND' },
  { label: '🇮🇹 Italien', value: 'ITALIEN' },
  { label: '🇵🇹 Portugais', value: 'PORTUGAIS' },
  { label: '🇷🇺 Russe', value: 'RUSSE' },
  { label: '🇨🇳 Chinois', value: 'CHINOIS' },
  { label: '🇯🇵 Japonais', value: 'JAPONAIS' },
  { label: '📦 Autre', value: 'AUTRE' },
];

export const AddBookScreen = () => {
  const navigation = useNavigation();
  const { fetchBooks } = useBookStore();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const showMessage = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showMessage('Permission refusée', 'Autorisez l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      console.error('Erreur pickImage:', error);
      showMessage('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const handleCreate = async () => {
    if (loading) return;

    if (!title.trim() || !author.trim()) {
      showMessage('Erreur', 'Titre et auteur sont obligatoires');
      return;
    }

    if (!genre) {
      showMessage('Erreur', 'Veuillez sélectionner un genre');
      return;
    }

    if (!language) {
      showMessage('Erreur', 'Veuillez sélectionner une langue');
      return;
    }

    const copies = parseInt(totalCopies);
    if (isNaN(copies) || copies < 1) {
      showMessage('Erreur', 'Le nombre d\'exemplaires doit être au moins 1');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/books', {
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        totalCopies: copies,
        genre,
        language,
      });

      const newBook = response.data.data;

      if (imageBase64 && newBook?.id) {
        try {
          await api.post('/books/upload-image', {
            bookId: newBook.id,
            imageBase64: `data:image/jpeg;base64,${imageBase64}`,
            filename: 'book-cover.jpg',
          });
        } catch (imgError) {
          console.error('Erreur upload image:', imgError);
        }
      }

      await fetchBooks();

      showMessage(
        '✅ Succès',
        `"${title}" a été ajouté au catalogue.`,
        () => navigation.goBack()
      );
    } catch (error: any) {
      console.error('Erreur création:', error.response?.data || error.message);
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.join('\n') ||
        'Impossible d\'ajouter le livre';
      showMessage('❌ Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const selectedGenreLabel =
    GENRES.find((g) => g.value === genre)?.label || 'Sélectionner un genre';
  const selectedLanguageLabel =
    LANGUAGES.find((l) => l.value === language)?.label || 'Sélectionner une langue';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={pickImage}
          activeOpacity={0.85}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.imageIconBg}>
                <Ionicons name="camera" size={26} color={colors.primary} />
              </View>
              <Text style={styles.imageText}>Ajouter une photo</Text>
              <Text style={styles.imageSubText}>Format 2:3 recommandé</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Formulaire */}
        <View style={styles.formCard}>
          {/* Titre */}
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Le Petit Prince"
            placeholderTextColor={colors.text.light}
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />

          {/* Auteur */}
          <Text style={styles.label}>Auteur *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Antoine de Saint-Exupéry"
            placeholderTextColor={colors.text.light}
            value={author}
            onChangeText={setAuthor}
            editable={!loading}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Résumé du livre..."
            placeholderTextColor={colors.text.light}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />

          {/* Nombre d'exemplaires */}
          <Text style={styles.label}>Nombre d'exemplaires *</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={colors.text.light}
            value={totalCopies}
            onChangeText={setTotalCopies}
            keyboardType="numeric"
            editable={!loading}
          />

          {/* Genre */}
          <Text style={styles.label}>Genre *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setGenreModalVisible(true)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.selectText, !genre && styles.selectPlaceholder]}
              numberOfLines={1}
            >
              {selectedGenreLabel}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Langue */}
          <Text style={styles.label}>Langue *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setLanguageModalVisible(true)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.selectText, !language && styles.selectPlaceholder]}
              numberOfLines={1}
            >
              {selectedLanguageLabel}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Bouton */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.buttonLoadingContent}>
              <ActivityIndicator color={colors.text.white} size="small" />
              <Text style={styles.buttonText}>Ajout en cours...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.text.white} />
              <Text style={styles.buttonText}>Ajouter le livre</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL GENRE */}
      <Modal
        visible={genreModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choisir un genre</Text>
                <Text style={styles.modalSubtitle}>Sélectionnez la catégorie du livre</Text>
              </View>
              <TouchableOpacity onPress={() => setGenreModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[
                    styles.modalOption,
                    genre === g.value && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setGenre(g.value);
                    setGenreModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      genre === g.value && styles.modalOptionTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                  {genre === g.value && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL LANGUE */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choisir une langue</Text>
                <Text style={styles.modalSubtitle}>Langue du livre</Text>
              </View>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.value}
                  style={[
                    styles.modalOption,
                    language === l.value && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setLanguage(l.value);
                    setLanguageModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      language === l.value && styles.modalOptionTextActive,
                    ]}
                  >
                    {l.label}
                  </Text>
                  {language === l.value && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Image picker
  imagePicker: {
    alignSelf: 'center',
    width: 150,
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  imageIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(27, 94, 63, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  imageSubText: {
    fontSize: 10,
    color: colors.text.light,
    textAlign: 'center',
  },

  // Formulaire
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectText: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  selectPlaceholder: {
    color: colors.text.light,
  },

  // Bouton
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.text.light,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 40, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionActive: {
    backgroundColor: 'rgba(27, 94, 63, 0.08)',
    borderColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
