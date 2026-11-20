# Sri Mallikarjuna Dairy website

## Run locally

1. Install Node.js (LTS) if it is not already installed.
2. Extract this ZIP.
3. Open the `sri-mallikarjuna-dairy` folder in VS Code. Make sure `package.json` is visible in the Explorer.
4. Open the VS Code terminal in that folder and run:

```bash
npm install
npm run dev
```

5. Open the local URL printed by Vite, usually http://localhost:5173/.

## Current business details

Edit `src/data.js` to update phone number, address, delivery areas, products and prices.

- Phone: 9014950541
- Address: Ashoknagar, Kamareddy
- Delivery area: Kamareddy
- Buffalo milk: ₹80 per litre
- Curd: ₹85 per kg

## Admin demo

Open `/admin`.

- Username: `admin`
- Password: `Dairy@123`

## Important before publishing

This is a frontend demo. Bookings are stored in the browser's localStorage, so they are not shared between different customers/devices. Admin login is demo-only and is not secure for production. For a real public dairy business website, connect a Spring Boot backend and PostgreSQL database, add secure admin authentication, and deploy the frontend/backend. Phone, address, service areas, prices and product units should be confirmed before going live.
