# PaySwift Wallet Frontend

Modern React wallet UI inspired by Paytm-style payment flows. The app includes authentication, OTP verification, dashboard, send money, QR scan, transaction history, recharge and bill payment, and profile/KYC screens.

## Tech Stack

- React + Vite
- Tailwind CSS
- Axios API client with JWT bearer token interceptor
- Context API for auth/session state
- Lucide React icons

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## API Setup

Set `VITE_API_URL` in an `.env` file to point to the backend.

```bash
VITE_API_URL=https://your-backend.example.com
```

The Axios client in `src/services/api.js` attaches `Authorization: Bearer <token>` when a token is available and dispatches auto logout on `401` responses.
