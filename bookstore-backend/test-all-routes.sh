#!/bin/bash
BASE="http://localhost:3000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC} - $1"; }
fail() { echo -e "${RED}❌ FAIL${NC} - $1"; }

echo "========================================="
echo "  BOOKSTORE API - FULL TEST SCENARIO"
echo "========================================="

# 0. RESET DATABASE TO NEUTRAL STATE
echo ""
echo "--- 0. RESETTING DATABASE ---"
npx prisma migrate reset --force --skip-seed 2>/dev/null
npx prisma db seed 2>/dev/null
echo "Database reset complete."

# 1. LOGIN as ADMIN
echo ""
echo "--- 1. LOGIN as ADMIN ---"
ADMIN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bookstore.com","password":"admin111"}')
TOKEN=$(echo "$ADMIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
ADMIN_USER_ID=$(echo "$ADMIN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then pass "Admin login"; else fail "Admin login"; fi

# 2. LOGIN as STAFF
STAFF=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@bookstore.com","password":"staff111"}')
STAFF_TOKEN=$(echo "$STAFF" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$STAFF_TOKEN" ]; then pass "Staff login"; else fail "Staff login"; fi

# 3. GET ALL BOOKS (paginated)
echo ""
echo "--- 3. GET ALL BOOKS (page 1, limit 3) ---"
RES=$(curl -s "$BASE/books?page=1&limit=3" -H "Authorization: Bearer $TOKEN")
COUNT=$(echo "$RES" | grep -o '"id"' | wc -l)
if [ "$COUNT" -eq 3 ]; then pass "Pagination works (3 books)"; else fail "Pagination (got $COUNT)"; fi

# 4. SEARCH BOOKS
echo ""
echo "--- 4. SEARCH '1984' ---"
RES=$(curl -s "$BASE/books?search=1984" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q "George Orwell"; then pass "Search works"; else fail "Search"; fi

# 5. FILTER AVAILABLE ONLY
echo ""
echo "--- 5. FILTER AVAILABLE ONLY ---"
RES=$(curl -s "$BASE/books?availableOnly=true" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q '"availableQuantity":0' || true; then
  # All books should have availableQuantity > 0 after reset
  ZERO=$(echo "$RES" | grep -c '"availableQuantity":0' || true)
  if [ "$ZERO" -eq 0 ]; then pass "Available filter"; else fail "Available filter (found $ZERO unavailable)"; fi
fi

# 6. GET SINGLE BOOK
echo ""
echo "--- 6. GET BOOK BY ID ---"
BOOK_ID=$(curl -s "$BASE/books?limit=1" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
RES=$(curl -s "$BASE/books/$BOOK_ID" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q '"status":"success"'; then pass "Get book by ID"; else fail "Get book by ID"; fi

# 7. CREATE A BOOK (admin - with valid ISBN)
echo ""
echo "--- 7. CREATE BOOK (admin) ---"
RES=$(curl -s -X POST $BASE/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Book","author":"Test Author","isbn":"9781234567890","description":"A test","totalQuantity":3,"isForSale":true,"isForRent":true}')
if echo "$RES" | grep -q '"status":"success"'; then 
  pass "Create book (admin)"
  NEW_BOOK_ID=$(echo "$RES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else 
  fail "Create book"
  echo "$RES"
fi

# 8. STAFF CREATE BOOK (should 403)
echo ""
echo "--- 8. STAFF CREATE BOOK (should fail) ---"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"title":"X","author":"Y","isbn":"9780987654321","totalQuantity":1}')
if [ "$HTTP" -eq 403 ]; then pass "Staff blocked from creating book"; else fail "Staff create book (HTTP $HTTP)"; fi

# 9. BORROW A BOOK (use a book with availableQuantity > 0)
echo ""
echo "--- 9. BORROW BOOK ---"
AVAIL_BOOK=$(curl -s "$BASE/books?limit=1" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
RES=$(curl -s -X POST $BASE/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\":\"$ADMIN_USER_ID\",\"bookId\":\"$AVAIL_BOOK\",\"dueDate\":\"2026-07-22T00:00:00.000Z\"}")
if echo "$RES" | grep -q '"status":"success"'; then
  pass "Borrow book"
  LOAN_ID=$(echo "$RES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
  fail "Borrow book"
  echo "$RES"
fi

# 10. GET ALL LOANS
echo ""
echo "--- 10. GET ALL LOANS ---"
RES=$(curl -s "$BASE/loans" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q '"status":"success"'; then pass "Get all loans"; else fail "Get all loans"; fi

# 11. RETURN A BOOK
echo ""
echo "--- 11. RETURN BOOK ---"
RES=$(curl -s -X PUT "$BASE/loans/$LOAN_ID/return" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q '"status":"success"'; then pass "Return book"; else fail "Return book"; fi

# 12. CREATE A SALE
echo ""
echo "--- 12. CREATE SALE ---"
RES=$(curl -s -X POST $BASE/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"bookId\":\"$NEW_BOOK_ID\",\"quantity\":2,\"totalPrice\":29.99}")
if echo "$RES" | grep -q '"status":"success"'; then pass "Create sale"; else fail "Create sale"; fi

# 13. GET ALL SALES
echo ""
echo "--- 13. GET ALL SALES ---"
RES=$(curl -s "$BASE/sales" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q '"status":"success"'; then pass "Get all sales"; else fail "Get all sales"; fi

# 14. SALES STATS
echo ""
echo "--- 14. SALES STATS ---"
RES=$(curl -s "$BASE/sales/stats" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q "totalRevenue"; then pass "Sales stats"; else fail "Sales stats"; fi

# 15. GET USERS (admin)
echo ""
echo "--- 15. GET USERS (admin) ---"
RES=$(curl -s "$BASE/users" -H "Authorization: Bearer $TOKEN")
if echo "$RES" | grep -q '"status":"success"'; then pass "Get users (admin)"; else fail "Get users"; fi

# 16. STAFF GET USERS (should 403)
echo ""
echo "--- 16. STAFF GET USERS (should fail) ---"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users" -H "Authorization: Bearer $STAFF_TOKEN")
if [ "$HTTP" -eq 403 ]; then pass "Staff blocked from users list"; else fail "Staff users access (HTTP $HTTP)"; fi

# 17. UPDATE BOOK (admin)
echo ""
echo "--- 17. UPDATE BOOK ---"
RES=$(curl -s -X PUT "$BASE/books/$NEW_BOOK_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated Test Book"}')
if echo "$RES" | grep -q "Updated Test Book"; then pass "Update book"; else fail "Update book"; fi

# 18. DELETE BOOK (admin)
echo ""
echo "--- 18. DELETE BOOK ---"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/books/$NEW_BOOK_ID" \
  -H "Authorization: Bearer $TOKEN")
if [ "$HTTP" -eq 200 ]; then pass "Delete book"; else fail "Delete book (HTTP $HTTP)"; fi

# RESET DATABASE AGAIN
echo ""
echo "--- RESETTING DATABASE TO NEUTRAL ---"
npx prisma migrate reset --force --skip-seed 2>/dev/null
npx prisma db seed 2>/dev/null
echo "Database is back to clean state."

echo ""
echo "========================================="
echo "  ALL TESTS COMPLETED"
echo "========================================="
