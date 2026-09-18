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
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useBookStore } from '../../store/book.store';
import { loanService } from '../../services/loan.service';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';

const GENRE_LABELS: Record<string, string> = {
  CORAN: '📖 Coran',
  TAFSIR: '📚 Tafsir',
  HADITH: '🕌 Hadith',
  FIQH: '⚖️ Fiqh',
  AQIDA: '🤲 Aqida',
  SIRA: '🌟 Sira',
  SUNNA: '📜 Sunna',
  SPIRITUALITE: '💫 Spiritualité',
  HISTOIRE_ISLAMIQUE: '🏛️ Histoire islamique',
  LANGUE_ARABE: '🔤 Langue arabe',
  EDUCATION_ENFANTS: '🧒 Éducation enfants',
  BIOGRAPHIE_SAVANTS: '👤 Biographie savants',
  DIVERS: '📦 Divers',
};

const LANGUAGE_LABELS: Record<string, string> = {
  ARABE: '🇸🇦 Arabe',
  FRANCAIS: '🇫🇷 Français',
  ARABE_FRANCAIS: '🇸🇦🇫🇷 Bilingue',
  ANGLAIS: '🇬🇧 Anglais',
  AUTRE: '📦 Autre',
};

export const BookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { fetchBooks } = useBookStore();
  const { book: initialBook } = route.params as any;

  const [book, setBook] = useState({
    ...initialBook,
    availableQuantity:
      initialBook.availableQuantity !== undefined
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
        showMessage('Permission refusée', 'Vous devez autoriser l\'accès à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
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
      showMessage('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const uploadImage = async (base64: string, filename: string) => {
    setUploadingImage(true);
    try {
      const response = await api.post('/books/upload-image', {
        bookId: book.id,
        imageBase64: `data:image/jpeg;base64,${base64}`,
        filename,
      });

      if (response.data.success) {
        setBook({ ...book, imageUrl: response.data.data.imageUrl });
        showMessage('✅ Succès', 'Image ajoutée avec succès !');
        fetchBooks();
      }
    } catch (error: any) {
      showMessage('Erreur', error.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const doBorrow = async () => {
    setLoading(true);
    setBorrowVisible(false);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      await loanService.borrowBook(user!.id, book.id, dueDate);

      setLoading(false);
      showMessage(
        '📚 Demande envoyée !',
        'Votre demande a bien été enregistrée. Un administrateur va la traiter.',
        () => navigation.goBack()
      );
    } catch (error: any) {
      setLoading(false);
      showMessage('Erreur', error.response?.data?.message || "Erreur lors de l'emprunt");
    }
  };

  const handleEdit = () => {
    setEditData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      totalCopies: String(book.totalCopies || book.totalQuantity || 1),
      genre: book.genre || 'AUTRE',
      language: book.language || 'FRANCAIS',
    });
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.title || !editData.author) {
      showMessage('Erreur', 'Titre et auteur sont requis');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/books/${book.id}`, {
        title: editData.title,
        author: editData.author,
        description: editData.description,
        totalCopies: parseInt(editData.totalCopies) || 1,
        genre: editData.genre,
        language: editData.language,
      });

      const updatedBook = {
        ...res.data.data,
        availableQuantity:
          res.data.data.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0,
        totalQuantity: res.data.data.totalCopies || 0,
        genreLabel: GENRE_LABELS[res.data.data.genre] || res.data.data.genre || 'Non défini',
        languageLabel:
          LANGUAGE_LABELS[res.data.data.language] || res.data.data.language || 'Non défini',
      };

      setBook(updatedBook);
      setEditVisible(false);
      fetchBooks();
      showMessage('✅ Succès', 'Livre mis à jour');
    } catch (error: any) {
      showMessage('Erreur', error.response?.data?.message || 'Échec de la modification');
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
      showMessage('✅ Succès', 'Livre supprimé', () => navigation.goBack());
    } catch (error: any) {
      showMessage('Erreur', error.response?.data?.message || 'Échec de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const genreOptions = Object.keys(GENRE_LABELS).map((key) => ({
    label: GENRE_LABELS[key],
    value: key,
  }));
  const languageOptions = Object.keys(LANGUAGE_LABELS).map((key) => ({
    label: LANGUAGE_LABELS[key],
    value: key,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ─── HEADER : image + infos ─── */}
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {book.imageUrl ? (
            <Image
              source={{ uri: `https://51-77-244-126.sslip.io${book.imageUrl}` }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={40} color={colors.text.light} />
            </View>
          )}
          {isAdmin && (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={pickImage}
              disabled={uploadingImage}
              activeOpacity={0.85}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={colors.text.white} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.text.white} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.author}>✍️ {book.author}</Text>

          <View style={styles.availabilityRow}>
            <View
              style={[
                styles.availabilityDot,
                isAvailable ? styles.availableDot : styles.unavailableDot,
              ]}
            />
            <Text
              style={[
                styles.availabilityText,
                isAvailable ? styles.availableText : styles.unavailableText,
              ]}
            >
              {isAvailable
                ? isAdmin
                  ? `Disponible (${book.availableQuantity} exemplaire${
                      book.availableQuantity > 1 ? 's' : ''
                    })`
                  : 'Disponible'
                : 'Indisponible'}
            </Text>
          </View>

          {/* Genre + langue */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{book.genreLabel}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{book.languageLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── DESCRIPTION ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.sectionLine} />
        </View>
        <Text style={styles.description}>
          {book.description || 'Aucune description disponible'}
        </Text>
      </View>

      {/* ─── DÉTAILS ADMIN ─── */}
      {isAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionTitle}>Détails (Admin)</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📦 Stock disponible</Text>
            <Text style={styles.detailValue}>
              {book.availableQuantity || 0} / {book.totalCopies || book.totalQuantity || 0}
            </Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>📚 Copies totales</Text>
            <Text style={styles.detailValue}>
              {book.totalCopies || book.totalQuantity || 0}
            </Text>
          </View>
        </View>
      )}

      {/* ─── ACTIONS ─── */}
      <View style={styles.actions}>
        {!isAdmin && (
          <TouchableOpacity
            style={[styles.button, styles.borrowButton, !isAvailable && styles.buttonDisabled]}
            onPress={() => setBorrowVisible(true)}
            disabled={!isAvailable || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.white} />
            ) : (
              <>
                <Ionicons
                  name={isAvailable ? 'book' : 'close-circle'}
                  size={18}
                  color={colors.text.white}
                />
                <Text style={styles.buttonText}>
                  {isAvailable ? 'Emprunter' : 'Indisponible'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={handleEdit}
              activeOpacity={0.85}
            >
              <Ionicons name="create" size={18} color={colors.text.white} />
              <Text style={styles.buttonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => setDeleteVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="trash" size={18} color={colors.text.white} />
              <Text style={styles.buttonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── MODAL EDIT ─── */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le livre</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Titre *</Text>
              <TextInput
                style={styles.modalInput}
                value={editData.title}
                onChangeText={(t) => setEditData({ ...editData, title: t })}
                placeholderTextColor={colors.text.light}
              />

              <Text style={styles.modalLabel}>Auteur *</Text>
              <TextInput
                style={styles.modalInput}
                value={editData.author}
                onChangeText={(t) => setEditData({ ...editData, author: t })}
                placeholderTextColor={colors.text.light}
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                value={editData.description}
                onChangeText={(t) => setEditData({ ...editData, description: t })}
                multiline
                placeholderTextColor={colors.text.light}
              />

              <Text style={styles.modalLabel}>Nombre de copies</Text>
              <TextInput
                style={styles.modalInput}
                value={editData.totalCopies}
                onChangeText={(t) => setEditData({ ...editData, totalCopies: t })}
                keyboardType="numeric"
                placeholderTextColor={colors.text.light}
              />

              <Text style={styles.modalLabel}>📚 Genre</Text>
              <View style={styles.chipGrid}>
                {genreOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      editData.genre === option.value && styles.chipActive,
                    ]}
                    onPress={() => setEditData({ ...editData, genre: option.value })}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editData.genre === option.value && styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>🌐 Langue</Text>
              <View style={styles.chipGrid}>
                {languageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      editData.language === option.value && styles.chipActive,
                    ]}
                    onPress={() => setEditData({ ...editData, language: option.value })}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        editData.language === option.value && styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>
                  {saving ? '...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL DELETE ─── */}
      <Modal visible={deleteVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="trash" size={28} color={colors.danger} />
            </View>
            <Text style={styles.confirmTitle}>Supprimer le livre</Text>
            <Text style={styles.confirmText}>
              Voulez-vous vraiment supprimer définitivement "{book.title}" ?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setDeleteVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDanger}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Text style={styles.confirmDangerText}>
                  {deleting ? '...' : 'Supprimer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL BORROW ─── */}
      <Modal visible={borrowVisible} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="book" size={28} color={colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>Emprunter ce livre</Text>
            <Text style={styles.confirmText}>
              Voulez-vous emprunter "{book.title}" pour une durée de 14 jours ?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setBorrowVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={doBorrow}
                disabled={loading}
              >
                <Text style={styles.modalSaveText}>
                  {loading ? '...' : 'Confirmer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },

  // ─── HEADER ───
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imageContainer: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookImage: { width: '100%', height: '100%' },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 10,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availableDot: { backgroundColor: colors.success },
  unavailableDot: { backgroundColor: colors.danger },
  availabilityText: { fontSize: 13, fontWeight: '600' },
  availableText: { color: colors.success },
  unavailableText: { color: colors.danger },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // ─── SECTIONS ───
  section: {
    padding: 18,
    backgroundColor: colors.background.secondary,
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // ─── ACTIONS ───
  actions: {
    padding: 16,
    paddingBottom: 30,
  },
  button: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  borrowButton: {
    backgroundColor: colors.primary,
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
  editButton: {
    backgroundColor: colors.warning,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    flex: 1,
  },
  buttonText: {
    color: colors.text.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  adminActions: { flexDirection: 'row', gap: 10 },

  // ─── MODALS ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 40, 0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 40, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTextarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.text.white },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.text.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // Confirmation
  confirmBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 30,
    alignSelf: 'center',
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmDanger: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  confirmDangerText: {
    color: colors.text.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
