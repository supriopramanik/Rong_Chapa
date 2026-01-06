# Rong Chapa - Print Service eCommerce Platform

Rong Chapa (রং ছাপা) is a modern print service eCommerce solution featuring a customer-facing storefront, authenticated custom print workflow, automatic customer account creation on guest orders, customer dashboard, and secure admin panel. The project is built with React, Node.js/Express, and MongoDB Atlas.

## Tech Stack

- **Frontend:** React, Vite, HTML5, CSS3, modern responsive UI
- **Backend:** Node.js, Express.js, REST API architecture
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JWT with bcrypt hashing, admin-only dashboard
- **Deployment:** Render (API + Frontend), MongoDB Atlas

## Project Structure

```
backend/
  src/
    config/          # Environment & database configuration
    controllers/     # Route controllers (auth, products, orders, admin)
    middleware/      # Error handling, auth, 404
    models/          # Mongoose schemas
    routes/          # API route definitions
    services/        # Admin seeding, dashboard stats
    utils/           # Logger, JWT helpers
    validators/      # express-validator chains
  .env.example
  package.json
frontend/
  src/
    components/      # Reusable UI components (common + admin)
    context/         # Auth context provider
    pages/           # Public and admin pages
    services/        # API client wrappers
    styles/          # Global + admin-specific styles
  package.json
README.md
```

## Quick Start

1. Install all dependencies from the project root (this installs backend and frontend packages automatically):
  ```bash
  npm install
  ```
2. Launch both the API and the frontend with a single command:
  ```bash
  npm run dev
  ```
3. The backend runs on `http://localhost:4000` and the frontend on `http://localhost:5173` with live reloads.

> Tip: use separate terminals if you want to run just one side — `npm run dev:backend` or `npm run dev:frontend` from the root.

## Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and configure values:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `PORT` – API port (default 4000)
   - `MONGODB_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – strong secret for token signing
   - `JWT_EXPIRES_IN` – token lifetime (e.g., `12h`)
   - `CLIENT_URL` – frontend origin (development: `http://localhost:5173`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – seeded admin credentials
3. Start the development server:
   ```bash
   npm run dev
   ```
4. API base URL (development): `http://localhost:4000/api/v1`

## Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Access the site at `http://localhost:5173`

## Sample API Requests

### 1. Customer Registration

**Request**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Shuvo Ahmed",
  "email": "shuvo@example.com",
  "password": "Secret123",
  "phone": "01700000000"
}
```

**Response**
```json
{
  "token": "<jwt-token>",
  "user": {
    "id": "665c...",
    "email": "shuvo@example.com",
    "name": "Shuvo Ahmed",
    "role": "customer",
    "phone": "01700000000"
  }
}
```

### 2. Login (Customer or Admin)

**Request**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@rongchapa.com",
  "password": "ChangeMe123!"
}
```

**Response**
```json
{
  "token": "<jwt-token>",
  "user": {
    "id": "665c...",
    "email": "admin@rongchapa.com",
    "name": "Rong Chapa Admin",
    "role": "admin"
  }
}
```

### 3. Fetch Current User Profile

**Request**
```http
GET /api/v1/auth/me
Authorization: Bearer <jwt-token>
```

**Response**
```json
{
  "user": {
    "_id": "665c...",
    "email": "shuvo@example.com",
    "name": "Shuvo Ahmed",
    "role": "customer",
    "phone": "01700000000",
    "createdAt": "2024-01-05T09:30:00.000Z"
  }
}
```

### 4. Submit Custom Print Request (Authenticated)

**Request**
```http
POST /api/v1/print-orders
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "description": "A5 flyers double-sided",
  "fileLink": "https://drive.google.com/your-design",
  "colorMode": "color",
  "paperSize": "a4",
  "quantity": 500,
  "collectionTime": "2024-01-12T18:00:00.000Z",
  "deliveryLocation": "SEU",
  "paymentTransaction": "BKASH123456"
}
```

**Response**
```json
{
  "message": "Print order received",
  "printOrder": {
    "_id": "665c...",
    "description": "A5 flyers double-sided",
    "colorMode": "color",
    "paperSize": "a4",
    "quantity": 500,
    "collectionTime": "2024-01-12T18:00:00.000Z",
    "deliveryLocation": "SEU",
    "status": "pending",
    "createdAt": "2024-01-05T10:24:00.000Z"
  }
}
```

### 5. View My Custom Print Requests

**Request**
```http
GET /api/v1/print-orders/mine
Authorization: Bearer <jwt-token>
```

**Response**
```json
{
  "printOrders": [
    {
      "_id": "665c...",
      "description": "A5 flyers double-sided",
      "colorMode": "color",
      "paperSize": "a4",
      "quantity": 500,
      "collectionTime": "2024-01-12T18:00:00.000Z",
      "deliveryLocation": "SEU",
      "status": "pending",
      "createdAt": "2024-01-05T10:24:00.000Z"
    }
  ]
}
```

### 6. Place Shop Order (Guest Checkout)

When an unauthenticated shopper submits a shop order and provides an email plus password, a customer account is created automatically and a JWT token is returned so the frontend can sign them in immediately.

**Request**
```http
POST /api/v1/orders
Content-Type: application/json

{
  "customerName": "Shuvo Ahmed",
  "customerEmail": "shuvo@example.com",
  "customerPhone": "01700000000",
  "product": "665c...",
  "quantity": 100,
  "size": "A5",
  "paperType": "Glossy",
  "notes": "Deliver to campus kiosk",
  "accountPassword": "Secret123"
}
```

### 7. Update Shop Order Billing (Admin)

**Request**
```http
PATCH /api/v1/orders/66ab.../billing
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "billingNumber": "INV-2024-001",
  "billingAmount": 4200,
  "billingNotes": "Due on delivery"
}
```

**Response**
```json
{
  "message": "Billing details saved",
  "order": {
    "_id": "66ab...",
    "status": "processing",
    "billing": {
      "number": "INV-2024-001",
      "amount": 4200,
      "notes": "Due on delivery",
      "generatedAt": "2024-01-05T13:20:00.000Z"
    }
  }
}
```

### 8. Download Invoice PDF (Admin)

**Request**
```http
GET /api/v1/orders/66ab.../invoice
Authorization: Bearer <admin-jwt>
```

**Response**

Returns a streamed PDF file with customer, order, and billing metadata that admins can download directly from the dashboard.

### 9. View My Shop Orders (Customer)

Customers can review every storefront purchase from their dashboard using this endpoint.

**Request**
```http
GET /api/v1/orders/mine
Authorization: Bearer <jwt-token>
```

**Response**
```json
{
  "orders": [
    {
      "_id": "66ab...",
      "product": {
        "_id": "665c...",
        "name": "Business Cards"
      },
      "quantity": 200,
      "size": "Standard",
      "paperType": "Matte",
      "status": "processing",
      "billing": {
        "number": "INV-2024-001",
        "amount": 4200,
        "generatedAt": "2024-01-05T13:20:00.000Z"
      },
      "createdAt": "2024-01-05T12:40:00.000Z"
    }
  ]
}
```

**Response**
```json
{
  "message": "Order created",
  "order": {
    "_id": "66ab...",
    "customerName": "Shuvo Ahmed",
    "customerEmail": "shuvo@example.com",
    "product": "665c...",
    "quantity": 100,
    "status": "pending",
    "createdAt": "2024-01-05T12:40:00.000Z"
  },
  "account": {
    "token": "<jwt-token>",
    "user": {
      "id": "66aa...",
      "email": "shuvo@example.com",
      "name": "Shuvo Ahmed",
      "role": "customer",
      "phone": "01700000000"
    }
  }
}
```

## Deployment (Render + MongoDB Atlas)

### 1. Prepare GitHub Repository

1. Initialize git and commit the project locally.
2. Create a new repository on GitHub (private or public as needed).
3. Push the code to GitHub:
   ```bash
   git remote add origin git@github.com:your-username/rong-chapa.git
   git push -u origin main
   ```

### 2. Deploy MongoDB Atlas

1. Create a free-tier cluster on MongoDB Atlas.
2. Add a database user with username/password (store securely).
3. Whitelist Render IP ranges or allow access from everywhere (0.0.0.0/0) for testing.
4. Copy the connection string and set it as `MONGODB_URI` for both backend environments.

### 3. Deploy Backend to Render (Web Service)

1. Create a new **Web Service** on Render.
2. Connect the GitHub repository and select the `backend` directory as the root.
3. Build Command: `npm install`
4. Start Command: `npm run start`
5. Environment Variables:
   - `PORT` (Render sets `PORT`; leave blank or set to 10000 if needed)
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CLIENT_URL` (set to deployed frontend URL)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
6. Deploy; Render will expose a public URL (e.g., `https://rong-chapa-api.onrender.com`).

### 4. Deploy Frontend to Render or Vercel

**Render Static Site**
1. Create a new **Static Site** on Render.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `frontend/dist`
4. Environment Variable: `VITE_API_BASE_URL` (optional override if API differs)
5. Set `_redirects` rules if needed for SPA (Vite handles automatically when using Render).

**Vercel (Alternative)**
1. Import the repository.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable: `VITE_API_BASE_URL` = Render API URL

### 5. Configure Frontend API Base URL

The frontend Axios client defaults to `/api/v1`. For production, set `VITE_API_BASE_URL`:

1. Create `frontend/.env` with:
   ```env
   VITE_API_BASE_URL=https://rong-chapa-api.onrender.com/api/v1
   ```
2. Update `src/services/httpClient.js` to use `import.meta.env.VITE_API_BASE_URL || '/api/v1'` if deploying (already proxied for dev).

## Testing Checklist

- ✅ Health check: `GET /health`
- ✅ Admin login and profile retrieval
- ✅ Customer registration and self profile (`/auth/me`)
- ✅ Product list (public) and admin CRUD
- ✅ Custom print request form submission
- ✅ Customer dashboard print history (`/print-orders/mine`)
- ✅ Customer dashboard shows shop orders (`/orders/mine`) with billing info
- ✅ Order placement from shop page
- ✅ Guest checkout auto-creates signed-in customer session
- ✅ Admin dashboard stats, shop order status changes, and billing PDFs

## Future Improvements

- Integrate email notifications on new orders
- Support file uploads via S3 or similar storage
- Add payment gateway integration
- Implement audit logs for admin actions
