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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useBookStore } from '../../store/book.store';
import { loanService } from '../../services/loan.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import api from '../../services/api';

export const BookDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { fetchBooks } = useBookStore();
  const { book: initialBook } = route.params as any;
  const [book, setBook] = useState(initialBook);
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editData, setEditData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    description: book.description || '',
    totalQuantity: String(book.totalQuantity),
    isForRent: book.isForRent,
    isForSale: book.isForSale,
  });
  const [saving, setSaving] = useState(false);
  const [borrowVisible, setBorrowVisible] = useState(false);

  // Delete confirmation
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      Alert.alert('Succès', 'Demande envoyée !');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || "Erreur lors de l'emprunt");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description || '',
      totalQuantity: String(book.totalQuantity),
      isForRent: book.isForRent,
      isForSale: book.isForSale,
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
        totalQuantity: parseInt(editData.totalQuantity) || 1,
        isForRent: editData.isForRent,
        isForSale: editData.isForSale,
      });
      setBook(res.data.data);
      setEditVisible(false);
      fetchBooks();
      Alert.alert('Succès', 'Livre mis à jour');
    } catch (error: any) {
      const msg = error.response?.data?.errors
        ? error.response.data.errors.join('\n')
        : error.response?.data?.message || "Échec de la modification";
      Alert.alert('Erreur', msg);
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>par {book.author}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Description</Text>
        <Text style={styles.description}>
          {book.description || 'Aucune description disponible'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ISBN :</Text>
          <Text style={styles.infoValue}>{book.isbn}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Stock :</Text>
          <Text style={[styles.infoValue, book.availableQuantity === 0 && styles.outOfStock]}>
            {book.availableQuantity} / {book.totalQuantity}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type :</Text>
          <Text style={styles.infoValue}>
            {book.isForRent && '📍 À emprunter '}
            {book.isForSale && '💰 À vendre'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {book.isForRent && !isAdmin && !isStaff && (
          <TouchableOpacity 
            style={[styles.button, styles.borrowButton]}
            onPress={handleBorrow}
            disabled={book.availableQuantity === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {book.availableQuantity > 0 ? '📖 Emprunter' : '❌ Indisponible'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Admin Edit/Delete */}
        {(isAdmin || isStaff) && (
          <>
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
              <Text style={styles.buttonText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => setDeleteVisible(true)}>
              <Text style={styles.buttonText}>🗑️ Supprimer</Text>
            </TouchableOpacity>
          </>
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
            <TextInput style={styles.modalInput} placeholder="Quantité" value={editData.totalQuantity} onChangeText={(t) => setEditData({...editData, totalQuantity: t})} keyboardType="numeric" />
            <View style={styles.modalToggles}>
              <TouchableOpacity style={[styles.toggle, editData.isForRent && styles.toggleActive]} onPress={() => setEditData({...editData, isForRent: !editData.isForRent})}>
                <Text style={[styles.toggleText, editData.isForRent && styles.toggleTextActive]}>📍 Empruntable</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, editData.isForSale && styles.toggleActive]} onPress={() => setEditData({...editData, isForSale: !editData.isForSale})}>
                <Text style={[styles.toggleText, editData.isForSale && styles.toggleTextActive]}>💰 Vendable</Text>
              </TouchableOpacity>
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

      {/* Delete Confirmation */}
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

      {/* Borrow Confirmation */}
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
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    padding: 20, backgroundColor: colors.background.secondary, marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  author: { fontSize: typography.fontSize.md, color: colors.text.secondary, marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: 12 },
  description: { fontSize: typography.fontSize.md, color: colors.text.secondary, lineHeight: 22 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { width: 80, fontSize: typography.fontSize.md, color: colors.text.secondary },
  infoValue: { flex: 1, fontSize: typography.fontSize.md, color: colors.text.primary },
  outOfStock: { color: colors.danger, fontWeight: typography.fontWeight.bold },
  actions: { padding: 20, gap: 12, marginBottom: 30 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  borrowButton: { backgroundColor: colors.info },
  editButton: { backgroundColor: '#FF9800' },
  deleteButton: { backgroundColor: '#f44336' },
  buttonText: { color: colors.text.white, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 16, textAlign: 'center' },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 15, color: colors.text.primary, marginBottom: 12 },
  modalToggles: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggle: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center' },
  toggleActive: { borderColor: colors.primary, backgroundColor: '#F0F4FF' },
  toggleText: { fontSize: 13, color: '#999' },
  toggleTextActive: { color: colors.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  modalCancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  modalSave: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  confirmBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginHorizontal: 30, alignSelf: 'center', width: '85%' },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  confirmText: { fontSize: 14, color: colors.text.secondary, marginBottom: 20 },
  confirmDanger: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f44336', alignItems: 'center' },
  confirmDangerText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});