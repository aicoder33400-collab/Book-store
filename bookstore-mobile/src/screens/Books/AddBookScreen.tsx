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

// Options de genre
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

// Options de langue
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée');
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
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const handleCreate = async () => {
  // 🔥 Empêcher les clics multiples
  if (loading) return;

  // Validation
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
    // 1. Créer le livre
    const response = await api.post('/books', {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      totalCopies: copies,
      genre,
      language,
    });

    const newBook = response.data.data;

    // 2. Upload l'image si sélectionnée
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

    // 3. Rafraîchir le catalogue
    await fetchBooks();

    // 🔥 Message de succès + retour au catalogue
    showMessage(
      '✅ Succès',
      `"${title}" a été ajouté au catalogue.`,
      () => navigation.goBack()
    );
  } catch (error: any) {
    console.error('Erreur création:', error.response?.data || error.message);
    const message = error.response?.data?.message 
      || error.response?.data?.errors?.join('\n') 
      || 'Impossible d\'ajouter le livre';
    showMessage('❌ Erreur', message);
  } finally {
    setLoading(false);
  }
};

// 🔥 Fonction pour afficher un message (compatible web + mobile)
const showMessage = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

  const selectedGenreLabel = GENRES.find(g => g.value === genre)?.label || 'Sélectionner un genre';
  const selectedLanguageLabel = LANGUAGES.find(l => l.value === language)?.label || 'Sélectionner une langue';

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
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#6C63FF" />
              <Text style={styles.imageText}>Ajouter une photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Titre */}
        <Text style={styles.label}>Titre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Le Petit Prince"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        {/* Auteur */}
        <Text style={styles.label}>Auteur *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Antoine de Saint-Exupéry"
          placeholderTextColor="#999"
          value={author}
          onChangeText={setAuthor}
          editable={!loading}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Résumé du livre..."
          placeholderTextColor="#999"
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
          placeholderTextColor="#999"
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
        >
          <Text style={[styles.selectText, !genre && styles.selectPlaceholder]}>
            {selectedGenreLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Langue */}
        <Text style={styles.label}>Langue *</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setLanguageModalVisible(true)}
          disabled={loading}
        >
          <Text style={[styles.selectText, !language && styles.selectPlaceholder]}>
            {selectedLanguageLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* 🔥 Bouton avec feedback */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.buttonLoadingContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>Ajout en cours...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Ajouter le livre</Text>
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
              <Text style={styles.modalTitle}>📚 Choisir un genre</Text>
              <TouchableOpacity onPress={() => setGenreModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
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
                    <Ionicons name="checkmark" size={20} color="#6C63FF" />
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
              <Text style={styles.modalTitle}>🌐 Choisir une langue</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
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
                    <Ionicons name="checkmark" size={20} color="#6C63FF" />
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
    backgroundColor: '#f8f9fc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imagePicker: {
    alignSelf: 'center',
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
  },
  imageText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  selectText: {
    fontSize: 15,
    color: '#1a1a2e',
  },
  selectPlaceholder: {
    color: '#999',
  },
  // 🔥 Bouton avec états
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#A8A4E0',
    opacity: 0.8,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#1a1a2e',
  },
  modalOptionTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});
