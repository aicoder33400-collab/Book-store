import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useBookStore } from '../../store/book.store';
import { loanService } from '../../services/loan.service';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// 🔥 Mapping des genres pour l'affichage
const GENRE_LABELS: Record<string, string> = {
  ROMAN: '📖 Roman',
  POESIE: '📝 Poésie',
  THEATRE: '🎭 Théâtre',
  HISTOIRE: '📜 Histoire',
  SCIENCE_FICTION: '🚀 Science-Fiction',
  FANTASTIQUE: '🧙 Fantastique',
  POLAR: '🔍 Polar',
  AVENTURE: '🗺️ Aventure',
  BIOGRAPHIE: '👤 Biographie',
  ESSAI: '📚 Essai',
  PHILOSOPHIE: '🧠 Philosophie',
  JEUNESSE: '🧒 Jeunesse',
  BANDE_DESSINEE: '🖼️ Bande dessinée',
  ART: '🎨 Art',
  CUISINE: '🍳 Cuisine',
  VOYAGE: '✈️ Voyage',
  SPORT: '⚽ Sport',
  SANTE: '💪 Santé',
  RELIGION: '🕌 Religion',
  AUTRE: '📦 Autre',
};

const LANGUAGE_LABELS: Record<string, string> = {
  FRANCAIS: '🇫🇷 Français',
  ANGLAIS: '🇬🇧 Anglais',
  ARABE: '🇸🇦 Arabe',
  ESPAGNOL: '🇪🇸 Espagnol',
  ALLEMAND: '🇩🇪 Allemand',
  ITALIEN: '🇮🇹 Italien',
  PORTUGAIS: '🇵🇹 Portugais',
  RUSSE: '🇷🇺 Russe',
  CHINOIS: '🇨🇳 Chinois',
  JAPONAIS: '🇯🇵 Japonais',
  AUTRE: '📦 Autre',
};

export const BookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { fetchBooks } = useBookStore();
  const { book: initialBook } = route.params as any;
  
  // 🔥 Transformer le livre initial pour ajouter availableQuantity
  const [book, setBook] = useState({
    ...initialBook,
    availableQuantity: initialBook.availableQuantity !== undefined 
      ? initialBook.availableQuantity 
      : initialBook.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0,
    totalQuantity: initialBook.totalCopies || 0,
    genreLabel: GENRE_LABELS[initialBook.genre] || initialBook.genre || 'Non défini',
    languageLabel: LANGUAGE_LABELS[initialBook.language] || initialBook.language || 'Non défini',
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    description: book.description || '',
    totalCopies: String(book.totalCopies || book.totalQuantity || 1),
    genre: book.genre || 'AUTRE',
    language: book.language || 'FRANCAIS',
  });
  const [saving, setSaving] = useState(false);
  const [borrowVisible, setBorrowVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAvailable = (book.availableQuantity || 0) > 0;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          uploadImage(asset.base64, asset.fileName || 'book-cover.jpg');
        }
      }
    } catch (error) {
      console.error('Erreur pickImage:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const uploadImage = async (base64: string, filename: string) => {
    setUploadingImage(true);
    try {
      const payload = {
        bookId: book.id,
        imageBase64: `data:image/jpeg;base64,${base64}`,
        filename: filename,
      };

      const response = await api.post('/books/upload-image', payload);

      if (response.data.success) {
        setBook({ ...book, imageUrl: response.data.data.imageUrl });
        Alert.alert('Succès', 'Image ajoutée avec succès !');
        fetchBooks();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBorrow = () => {
    setBorrowVisible(true);
  };

  const doBorrow = async () => {
    setLoading(true);
    setBorrowVisible(false);
    
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      await loanService.borrowBook(user!.id, book.id, dueDate);
      
      setLoading(false);
      
      Alert.alert(
        '📚 Demande envoyée !',
        'Votre demande d\'emprunt a bien été prise en compte.\nUn administrateur va la traiter.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || "Erreur lors de l'emprunt";
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleEdit = () => {
    setEditData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description || '',
      totalCopies: String(book.totalCopies || book.totalQuantity || 1),
      genre: book.genre || 'AUTRE',
      language: book.language || 'FRANCAIS',
    });
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.title || !editData.author || !editData.isbn) {
      Alert.alert('Erreur', 'Titre, auteur et ISBN sont requis');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/books/${book.id}`, {
        title: editData.title,
        author: editData.author,
        isbn: editData.isbn,
        description: editData.description,
        totalCopies: parseInt(editData.totalCopies) || 1,
        genre: editData.genre,
        language: editData.language,
      });
      
      const updatedBook = {
        ...res.data.data,
        availableQuantity: res.data.data.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0,
        totalQuantity: res.data.data.totalCopies || 0,
        genreLabel: GENRE_LABELS[res.data.data.genre] || res.data.data.genre || 'Non défini',
        languageLabel: LANGUAGE_LABELS[res.data.data.language] || res.data.data.language || 'Non défini',
      };
      
      setBook(updatedBook);
      setEditVisible(false);
      fetchBooks();
      Alert.alert('Succès', 'Livre mis à jour');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || "Échec de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/books/${book.id}`);
      setDeleteVisible(false);
      fetchBooks();
      Alert.alert('Succès', 'Livre supprimé');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // 🔥 Options pour le formulaire d'édition
  const genreOptions = Object.keys(GENRE_LABELS).map(key => ({ label: GENRE_LABELS[key], value: key }));
  const languageOptions = Object.keys(LANGUAGE_LABELS).map(key => ({ label: LANGUAGE_LABELS[key], value: key }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {book.imageUrl ? (
            <Image 
              source={{ uri: `http://localhost:3000${book.imageUrl}` }} 
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={40} color="#ccc" />
            </View>
          )}
          {isAdmin && (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploadingImage}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera-outline" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.author}>✍️ {book.author}</Text>
          <View style={styles.availabilityRow}>
            <View style={[styles.availabilityDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
            <Text style={[styles.availabilityText, isAvailable ? styles.availableText : styles.unavailableText]}>
              {isAvailable ? `✅ Disponible (${book.availableQuantity} exemplaire${book.availableQuantity > 1 ? 's' : ''})` : '❌ Indisponible'}
            </Text>
          </View>
          {/* 🔥 Genre et Langue affichés pour tout le monde */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {book.genreLabel}
            </Text>
            <Text style={styles.metaText}>
              {book.languageLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Description</Text>
        <Text style={styles.description}>
          {book.description || 'Aucune description disponible'}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Détails (Admin)</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ISBN</Text>
            <Text style={styles.detailValue}>{book.isbn}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock</Text>
            <Text style={styles.detailValue}>{book.availableQuantity || 0} / {book.totalCopies || book.totalQuantity || 0}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Copies totales</Text>
            <Text style={styles.detailValue}>{book.totalCopies || book.totalQuantity || 0}</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!isAdmin && (
          <TouchableOpacity 
            style={[styles.button, styles.borrowButton]}
            onPress={handleBorrow}
            disabled={!isAvailable || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isAvailable ? '📖 Emprunter' : '❌ Indisponible'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
              <Text style={styles.buttonText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => setDeleteVisible(true)}>
              <Text style={styles.buttonText}>🗑️ Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Modifier le livre</Text>
            <TextInput style={styles.modalInput} placeholder="Titre *" value={editData.title} onChangeText={(t) => setEditData({...editData, title: t})} />
            <TextInput style={styles.modalInput} placeholder="Auteur *" value={editData.author} onChangeText={(t) => setEditData({...editData, author: t})} />
            <TextInput style={styles.modalInput} placeholder="ISBN *" value={editData.isbn} onChangeText={(t) => setEditData({...editData, isbn: t})} keyboardType="numeric" />
            <TextInput style={styles.modalInput} placeholder="Description" value={editData.description} onChangeText={(t) => setEditData({...editData, description: t})} multiline />
            <TextInput style={styles.modalInput} placeholder="Nombre de copies" value={editData.totalCopies} onChangeText={(t) => setEditData({...editData, totalCopies: t})} keyboardType="numeric" />
            
            {/* 🔥 Genre */}
            <View style={styles.modalSelectContainer}>
              <Text style={styles.modalSelectLabel}>📚 Genre</Text>
              <View style={styles.modalSelectWrapper}>
                {genreOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalSelectOption,
                      editData.genre === option.value && styles.modalSelectOptionActive,
                    ]}
                    onPress={() => setEditData({...editData, genre: option.value})}
                  >
                    <Text style={[
                      styles.modalSelectText,
                      editData.genre === option.value && styles.modalSelectTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 🔥 Langue */}
            <View style={styles.modalSelectContainer}>
              <Text style={styles.modalSelectLabel}>🌐 Langue</Text>
              <View style={styles.modalSelectWrapper}>
                {languageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalSelectOption,
                      editData.language === option.value && styles.modalSelectOptionActive,
                    ]}
                    onPress={() => setEditData({...editData, language: option.value})}
                  >
                    <Text style={[
                      styles.modalSelectText,
                      editData.language === option.value && styles.modalSelectTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveEdit} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? '...' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deleteVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Supprimer</Text>
            <Text style={styles.confirmText}>Supprimer définitivement "{book.title}" ?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDanger} onPress={handleDelete} disabled={deleting}>
                <Text style={styles.confirmDangerText}>{deleting ? '...' : 'Supprimer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Borrow Modal */}
      <Modal visible={borrowVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Emprunter</Text>
            <Text style={styles.confirmText}>
              Voulez-vous emprunter "{book.title}" pour 14 jours ?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setBorrowVisible(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={doBorrow} disabled={loading}>
                <Text style={styles.modalSaveText}>{loading ? '...' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },

  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageContainer: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#f5f6fa',
    overflow: 'hidden',
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(108,99,255,0.85)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availableDot: {
    backgroundColor: '#4CAF50',
  },
  unavailableDot: {
    backgroundColor: '#f44336',
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  availableText: {
    color: '#4CAF50',
  },
  unavailableText: {
    color: '#f44336',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },

  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
  },
  detailValue: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '500',
  },

  actions: {
    padding: 16,
    paddingBottom: 30,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  borrowButton: {
    backgroundColor: '#6C63FF',
  },
  editButton: {
    backgroundColor: '#FF9800',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    marginBottom: 12,
  },
  modalSelectContainer: {
    marginBottom: 12,
  },
  modalSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  modalSelectWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalSelectOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalSelectOptionActive: {
    backgroundColor: 'rgba(108,99,255,0.1)',
    borderColor: '#6C63FF',
  },
  modalSelectText: {
    fontSize: 12,
    color: '#666',
  },
  modalSelectTextActive: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  modalSave: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 30,
    alignSelf: 'center',
    width: '85%',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  confirmDanger: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  confirmDangerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});