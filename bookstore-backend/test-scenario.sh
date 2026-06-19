#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU2YWE2Y2ZjLTQ2ZWQtNDA3Yi1iMTE1LTA3OTY1YWRiNWY1NiIsImVtYWlsIjoiYWRtaW5AYm9va3N0b3JlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NDE2OTIzMiwiZXhwIjoxNzc0Nzc0MDMyfQ.rcIwZkkFql9yYCIL3wgvlxMpeRc-TA1gH-CZ1xaQv0E"
STAFF_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNkMGVmZDc3LWMwMDQtNDU1Yi05YjUyLTY0M2ZhNmRlZDg1ZiIsImVtYWlsIjoic3RhZmZAYm9va3N0b3JlLmNvbSIsInJvbGUiOiJTVEFGRiIsImlhdCI6MTc3NDE2OTI1NCwiZXhwIjoxNzc0Nzc0MDU0fQ.hDJn-j5uMJrOY7ilGuQDQfWVUZJcYevAUDnK6X2ezhE"
BOOK_ID="6664cf1d-c701-4697-b1ed-d8c099bd9f4d"

# Fonction pour afficher les requêtes
print_request() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📤 $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

echo "========================================="
echo "📚 BOOKSTORE BACKEND - TEST SCENARIO COMPLET"
echo "========================================="
echo ""

# ============================================
# SECTION 1: BOOKS MANAGEMENT
# ============================================
echo "📖 SECTION 1: GESTION DES LIVRES"
echo "========================================="

# 1. Voir tous les livres
print_request "GET /books - Lister tous les livres"
curl -s -X GET "$API_URL/books" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 2. Voir un livre spécifique
print_request "GET /books/$BOOK_ID - Voir le détail d'un livre"
curl -s -X GET "$API_URL/books/$BOOK_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 3. Créer un livre vendable uniquement
print_request "POST /books - Créer un livre (vendable uniquement)"
SALE_ONLY_RESPONSE=$(curl -s -X POST "$API_URL/books" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Book for Sale Only",
    "author": "Test Author",
    "isbn": "9781234567890",
    "description": "This book can only be sold, not rented",
    "totalQuantity": 5,
    "isForSale": true,
    "isForRent": false
  }')
echo $SALE_ONLY_RESPONSE | jq '.'
SALE_ONLY_ID=$(echo $SALE_ONLY_RESPONSE | jq -r '.data.id')
echo ""

# 4. Créer un livre prêtable uniquement
print_request "POST /books - Créer un livre (prêtable uniquement)"
RENT_ONLY_RESPONSE=$(curl -s -X POST "$API_URL/books" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Book for Rent Only",
    "author": "Test Author",
    "isbn": "9780987654321",
    "description": "This book can only be rented, not sold",
    "totalQuantity": 3,
    "isForSale": false,
    "isForRent": true
  }')
echo $RENT_ONLY_RESPONSE | jq '.'
RENT_ONLY_ID=$(echo $RENT_ONLY_RESPONSE | jq -r '.data.id')
echo ""

# 5. Rechercher des livres
print_request "GET /books?search=1984 - Rechercher des livres par titre"
curl -s -X GET "$API_URL/books?search=1984" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 6. Filtrer livres disponibles (afficher la réponse complète)
print_request "GET /books?availableOnly=true - Filtrer livres disponibles"
curl -s -X GET "$API_URL/books?availableOnly=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# ============================================
# SECTION 2: USER MANAGEMENT
# ============================================
echo "👥 SECTION 2: GESTION DES UTILISATEURS"
echo "========================================="

# 7. Créer un utilisateur staff
print_request "POST /users - Créer un utilisateur staff"
STAFF_RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Staff User",
    "email": "teststaff@bookstore.com",
    "password": "test123",
    "role": "STAFF"
  }')
echo $STAFF_RESPONSE | jq '.'
STAFF_ID=$(echo $STAFF_RESPONSE | jq -r '.data.id')
echo ""

# 8. Lister tous les utilisateurs (afficher la réponse complète)
print_request "GET /users - Lister tous les utilisateurs (Admin only)"
curl -s -X GET "$API_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 9. Tester accès Staff aux users (doit échouer)
print_request "GET /users - Staff tente d'accéder (doit échouer - 403)"
curl -s -X GET "$API_URL/users" \
  -H "Authorization: Bearer $STAFF_TOKEN" | jq '.'
echo ""

# ============================================
# SECTION 3: LOANS MANAGEMENT
# ============================================
echo "📚 SECTION 3: GESTION DES EMPRUNTS"
echo "========================================="

# 10. Emprunter un livre prêtable
print_request "POST /loans - Emprunter un livre (livre prêtable)"
LOAN_RESPONSE=$(curl -s -X POST "$API_URL/loans" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$STAFF_ID\",
    \"bookId\": \"$RENT_ONLY_ID\",
    \"dueDate\": \"2026-04-05T10:00:00.000Z\"
  }")
echo $LOAN_RESPONSE | jq '.'
LOAN_ID=$(echo $LOAN_RESPONSE | jq -r '.data.id')
echo ""

# 11. Tenter d'emprunter un livre vendable (doit échouer)
print_request "POST /loans - Tenter d'emprunter livre vendable (doit échouer - 400)"
curl -s -X POST "$API_URL/loans" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$STAFF_ID\",
    \"bookId\": \"$SALE_ONLY_ID\",
    \"dueDate\": \"2026-04-05T10:00:00.000Z\"
  }" | jq '.'
echo ""

# 12. Vérifier le stock après emprunt
print_request "GET /books/$RENT_ONLY_ID - Vérifier stock après emprunt"
curl -s -X GET "$API_URL/books/$RENT_ONLY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 13. Lister tous les emprunts (afficher la réponse complète)
print_request "GET /loans - Lister tous les emprunts"
curl -s -X GET "$API_URL/loans" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 14. Retourner le livre
print_request "PUT /loans/$LOAN_ID/return - Retourner le livre"
RETURN_RESPONSE=$(curl -s -X PUT "$API_URL/loans/$LOAN_ID/return" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo $RETURN_RESPONSE | jq '.'
echo ""

# 15. Vérifier le stock après retour
print_request "GET /books/$RENT_ONLY_ID - Vérifier stock après retour"
curl -s -X GET "$API_URL/books/$RENT_ONLY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# ============================================
# SECTION 4: SALES MANAGEMENT
# ============================================
echo "💰 SECTION 4: GESTION DES VENTES"
echo "========================================="

# 16. Vendre un livre vendable
print_request "POST /sales - Vendre un livre (livre vendable)"
SALE_RESPONSE=$(curl -s -X POST "$API_URL/sales" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"bookId\": \"$SALE_ONLY_ID\",
    \"quantity\": 2,
    \"totalPrice\": 39.98
  }")
echo $SALE_RESPONSE | jq '.'
SALE_ID=$(echo $SALE_RESPONSE | jq -r '.data.id')
echo ""

# 17. Tenter de vendre un livre prêtable (doit échouer)
print_request "POST /sales - Tenter de vendre livre prêtable (doit échouer - 400)"
curl -s -X POST "$API_URL/sales" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"bookId\": \"$RENT_ONLY_ID\",
    \"quantity\": 1,
    \"totalPrice\": 19.99
  }" | jq '.'
echo ""

# 18. Vérifier le stock après vente
print_request "GET /books/$SALE_ONLY_ID - Vérifier stock après vente"
curl -s -X GET "$API_URL/books/$SALE_ONLY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 19. Lister toutes les ventes
print_request "GET /sales - Lister toutes les ventes"
curl -s -X GET "$API_URL/sales" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 20. Voir les statistiques des ventes
print_request "GET /sales/stats - Voir les statistiques des ventes"
curl -s -X GET "$API_URL/sales/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 21. Voir une vente spécifique
print_request "GET /sales/$SALE_ID - Voir le détail d'une vente"
curl -s -X GET "$API_URL/sales/$SALE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# ============================================
# SECTION 5: CLEANUP
# ============================================
echo "🧹 SECTION 5: NETTOYAGE"
echo "========================================="

# 22. Supprimer le livre vendable
print_request "DELETE /books/$SALE_ONLY_ID - Supprimer le livre vendable"
curl -s -X DELETE "$API_URL/books/$SALE_ONLY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 23. Supprimer le livre prêtable
print_request "DELETE /books/$RENT_ONLY_ID - Supprimer le livre prêtable"
curl -s -X DELETE "$API_URL/books/$RENT_ONLY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# 24. Supprimer l'utilisateur
print_request "DELETE /users/$STAFF_ID - Supprimer l'utilisateur de test"
curl -s -X DELETE "$API_URL/users/$STAFF_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

echo "========================================="
echo "✅ TEST SCENARIO COMPLET"
echo "========================================="