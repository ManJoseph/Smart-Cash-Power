# 💡 SmartCashPower

A modern, intelligent electricity management platform that revolutionizes how users purchase and manage prepaid electricity. Built with React, TypeScript, and Vite, SmartCashPower brings a seamless experience to prepaid utility customers and administrators. 🚀

Whether you're buying electricity tokens, tracking consumption, or managing multiple meters, SmartCashPower delivers a fast, intuitive, and secure interface for all your power management needs.

---

## ✨ Features

### For Users
- 🛍️ **Instant Electricity Purchases** – Buy tokens for any registered meter in just three steps
- 📊 **Usage Analytics** – Track spending history and monitor token deliveries in real-time
- 🏠 **Multi-Meter Management** – Register and manage multiple meters from one dashboard
- 💾 **Transaction History** – Keep a complete record of all purchases and consumption
- 🔒 **Secure Authentication** – Role-based access with secure login and registration

### For Administrators
- 👥 **Customer Management** – Monitor active users and meter registrations
- ✅ **Transaction Oversight** – Review and approve flagged transactions
- 📋 **Meter Registration Approvals** – Validate customer requests and maintain data integrity
- 📢 **System Notifications** – Send outage alerts and updates to impacted customers
- 📈 **Analytics Dashboard** – Track active users, monitored meters, and pending support tickets

---

## 🎯 Tech Stack

### Frontend
- **Frontend Framework** – React 18+ with TypeScript
- **Build Tool** – Vite (lightning-fast builds and HMR)
- **Styling** – Tailwind CSS for responsive, modern UI
- **Routing** – React Router v6 for seamless navigation
- **State Management** – React Hooks (useState, useCallback, useEffect)
- **API Communication** – Fetch API with custom service layer
- **Development** – ESLint, TypeScript strict mode

### Backend
This frontend application works in conjunction with a dedicated backend API service. The backend handles:
- User authentication and authorization
- Meter registration and management
- Transaction processing and history
- Admin operations and approvals
- Database persistence and validation

For the complete system, refer to the backend repository.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn installed
- Backend API running on `http://localhost:8080`
- Modern browser with ES6+ support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ManJoseph/Smart-Cash-Power.git
   cd smart-cash-power-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API endpoints** (if needed)
   - Update proxy settings in `vite.config.ts` if your backend runs on a different port
   - Default: `http://localhost:8080/api`

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build
```

Output will be in the `dist/` directory.

---

## 📁 Project Structure

```
smart-cash-power-ui/
├── src/
│   ├── App.tsx              # Main app with routing and state management
│   ├── index.css            # Global styles with Tailwind directives
│   ├── services/
│   │   └── apiService.ts    # API communication layer
│   ├── components/
│   │   ├── PurchaseScreen.tsx
│   │   └── HistoryScreen.tsx
│   └── main.tsx             # Entry point
├── vite.config.ts           # Vite configuration with API proxy
├── tsconfig.json            # TypeScript configuration
└── package.json
```

---

## 🔐 Security Considerations

### Authentication & Storage
- User sessions are stored securely in browser storage (managed by `apiService`)
- Sensitive tokens should never be exposed in the UI
- Always validate user roles on the backend

### API Security Best Practices
1. **Use HTTPS in production** – Encrypt all data in transit
2. **Backend Proxy** – Route sensitive API calls through your backend server
3. **CORS Configuration** – Restrict cross-origin requests appropriately
4. **Rate Limiting** – Implement rate limits on the backend to prevent abuse
5. **Input Validation** – Validate all user inputs on both frontend and backend

### Environment Variables
Create a `.env` file in the root directory for sensitive configuration:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

⚠️ **Important:** Never commit `.env` files with sensitive data. Use `.env.example` as a template.

---

## 🧪 Key Features Deep Dive

### User Dashboard
- Real-time meter data display
- One-click access to purchase and history screens
- Add new meters with instant validation
- Quick logout functionality

### Purchase Flow
- Select from registered meters
- Enter desired units
- Process payment securely
- Instant token delivery confirmation

### Admin Console
- Real-time statistics (active users, monitored meters, pending tickets)
- Quick-access action menu for common tasks
- Customer workspace link for support scenarios
- Transaction monitoring and approval workflows

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the developer at josephmanizabayo7@gmail.com

---

## 👨‍💼 Original Concept & Design

**Original idea by:** Joseph Manizabayo

SmartCashPower was conceived and designed to bring intelligent electricity management to prepaid utility customers worldwide. The vision encompasses both frontend and backend systems working seamlessly to deliver a complete smart utility solution.

---

**Built with ❤️ for a smarter energy future**
