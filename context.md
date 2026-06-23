# BookStore - Library Management App

Full-stack application for managing a library: book catalogue, borrowing, sales, and user management.

---

## Architecture

```
book-store/
├── bookstore-backend/      # Express + TypeScript + Prisma + PostgreSQL
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API route definitions
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── validations/    # Joi schemas
│   │   └── utils/          # Helpers (catchAsync, AppError, ApiResponse)
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       ├── migrations/     # Database migrations
│       └── seed.ts         # Test data seeder
│
├── bookstore-mobile/       # React Native (Expo) + TypeScript + Zustand
│   ├── src/
│   │   ├── screens/        # UI screens
│   │   ├── navigation/     # Role-based drawer navigator
│   │   ├── services/       # API client + service modules
│   │   ├── store/          # Zustand state stores
│   │   └── theme/          # Colors & typography
│   └── App.tsx             # Entry point
│
└── test-all-routes.sh      # Backend API test script
```

---

## How to Launch

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- npm

### 1. Start PostgreSQL
```
sudo pg_ctlcluster 16 main start
```

### 2. Backend
```
cd bookstore-backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```
Runs on http://localhost:3000

### 3. Mobile (Web)
```
cd bookstore-mobile
npm install
npx expo start --web
```
Runs on http://localhost:8082

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bookstore.com | admin111 |
| Staff | staff@bookstore.com | staff111 |

---

## Database

PostgreSQL - database name: `bookstore`

### Tables
| Table | Description |
|-------|-------------|
| users | Admin and staff accounts |
| books | Book catalogue with quantity tracking |
| loans | Borrowing lifecycle |
| sales | Sale transactions |

### Loan Lifecycle
```
REQUESTED -> APPROVED -> BORROWED -> RETURNED
                |
            REJECTED

BORROWED + overdue -> LATE
```

| Status | Meaning |
|--------|---------|
| REQUESTED | User requested to borrow |
| APPROVED | Admin approved, book reserved |
| REJECTED | Admin declined |
| BORROWED | Book physically handed over |
| RETURNED | Book returned on time |
| LATE | Book returned late |

### Stock Logic
- `totalQuantity`: total copies owned
- `availableQuantity`: copies available (decremented on APPROVED, incremented on RETURN)
- Book cannot be borrowed if availableQuantity = 0

---

## API Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/login | No | Login, returns JWT token |

### Books
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /api/books | Yes | Any | List with pagination, search, filter |
| GET | /api/books/:id | Yes | Any | Get by ID |
| POST | /api/books | Yes | ADMIN | Create book |
| PUT | /api/books/:id | Yes | ADMIN | Update book |
| DELETE | /api/books/:id | Yes | ADMIN | Delete book |

### Loans
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /api/loans | Yes | ADMIN,STAFF | Create borrow request (status: REQUESTED) |
| PUT | /api/loans/:id/approve | Yes | ADMIN | Approve request |
| PUT | /api/loans/:id/reject | Yes | ADMIN | Reject request |
| PUT | /api/loans/:id/hand-over | Yes | ADMIN | Hand over physical book |
| PUT | /api/loans/:id/return | Yes | ADMIN,STAFF | Return book |
| GET | /api/loans | Yes | ADMIN,STAFF | List all loans |
| GET | /api/loans/:id | Yes | ADMIN,STAFF | Get loan detail |

### Sales
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /api/sales | Yes | ADMIN,STAFF | Create sale |
| GET | /api/sales | Yes | ADMIN,STAFF | List sales |
| GET | /api/sales/stats | Yes | ADMIN,STAFF | Sales statistics |
| GET | /api/sales/:id | Yes | ADMIN,STAFF | Get sale detail |

### Users
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /api/users | Yes | ADMIN | List users |
| GET | /api/users/:id | Yes | ADMIN | Get user detail |
| POST | /api/users | Yes | ADMIN | Create user |
| PUT | /api/users/:id | Yes | ADMIN | Update user |
| DELETE | /api/users/:id | Yes | ADMIN | Delete user |

### Admin
| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /api/admin/dashboard | Yes | ADMIN | Dashboard stats |

---

## Mobile Screens

### Admin Role
| Screen | Status | Description |
|--------|--------|-------------|
| Dashboard | Done | Stats cards, pending requests, approved pickups, recent sales |
| Catalogue | Done | Browse books, search, filter by availability |
| Tous les emprunts | Done | All loans with approve/reject/hand-over/return actions |
| Ventes | Partial | Sales history exists, create sale needs testing |
| Utilisateurs | Done | User list with detail modal |
| Mon profil | Needs test | Profile screen |

### Staff Role
| Screen | Status | Description |
|--------|--------|-------------|
| Catalogue | Done | Browse and request books |
| Mes emprunts | Needs test | Staff's own loans |
| Mon profil | Needs test | Profile screen |

---

## To Do

### Priority 1 - Complete Existing Screens
- [ ] Ventes: Test create sale flow from catalogue
- [ ] Mes emprunts: Verify loan list + return action for staff
- [ ] Mon profil: Verify profile display and edit capability
- [ ] Logout button: Add to drawer or header

### Priority 2 - Polish
- [ ] Error toast notifications (instead of silent failures)
- [ ] Pull-to-refresh on all list screens
- [ ] Loading skeletons
- [ ] Better empty states with illustrations

### Priority 3 - Features
- [ ] Password change for users
- [ ] Email notifications for overdue books
- [ ] Book cover images
- [ ] Advanced search filters (by author, ISBN, genre)
- [ ] Export sales/loans reports

### Priority 4 - DevOps
- [ ] Docker Compose for full stack
- [ ] CI/CD pipeline
- [ ] Production build for mobile

---

## Testing

### Backend API Test
```
cd bookstore-backend
bash test-all-routes.sh
```
Tests all 18 endpoints, resets database before and after.

### Manual E2E Test Flow
1. Login as admin
2. Check Dashboard shows stats
3. Go to Catalogue, tap a book, tap Emprunter
4. Back to Dashboard, see pending request
5. Approve request, it moves to "En attente de retrait"
6. Hand over book, loan becomes active
7. Check "Tous les emprunts", shows the loan
8. Check "Utilisateurs", see user list

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT, bcryptjs |
| Validation | Joi |
| Mobile | React Native, Expo |
| State | Zustand |
| Navigation | React Navigation (Drawer + Stack) |
| HTTP | Axios |

---

## Development Notes

- Backend runs on port 3000, mobile web on 8082
- API base URL configured in `bookstore-mobile/src/services/api.ts`
- Authentication uses Bearer token stored in AsyncStorage
- Role-based access: ADMIN sees dashboard + user management; STAFF sees catalogue + personal loans
- Database seed creates 2 users and 10 books, run `npx prisma db seed` to reset
- Test script resets the database automatically before and after
