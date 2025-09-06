# 🎉 Xyzon Event Management Frontend

A comprehensive event management platform built with React and Vite, featuring modern UI/UX design, payment integration, certificate management, and role-based access control.

## ✨ Features

### 🎯 Core Features

- **Event Management**: Create, edit, delete, and manage events with rich details
- **User Registration**: Seamless event registration with custom forms
- **Payment Integration**: Razorpay integration for paid events
- **Certificate Management**: Automated certificate generation and distribution
- **Role-Based Access**: Admin and user dashboards with appropriate permissions
- **Email Notifications**: Automated emails for registrations, reminders, and certificates
- **QR Code Integration**: Event and certificate verification via QR codes

### 👨‍💼 Admin Features

- **Event Creation**: Full-featured event creation with custom registration questions
- **Registration Management**: View and manage event registrations
- **Attendance Tracking**: Mark attendance manually, via QR, or automatically
- **Certificate Issuance**: Issue individual or bulk certificates
- **Analytics Dashboard**: Event statistics and revenue tracking
- **Email Reminders**: Send event reminders to registered participants
- **Payment Management**: View payments and process refunds

### 👨‍💻 User Features

- **Event Discovery**: Browse and search events with filters
- **Event Registration**: Register for free or paid events
- **Payment Processing**: Secure payment via Razorpay
- **Registration History**: View all event registrations and status
- **Certificate Access**: Download issued certificates
- **Event Reminders**: Receive automated email reminders

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn package manager
- Backend API server running (see API documentation)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd xyzon-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   # API Configuration
   VITE_API_URL=http://localhost:5000/api

   # Razorpay Configuration
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here

   # App Configuration
   VITE_APP_NAME=Xyzon Events
   VITE_APP_VERSION=1.0.0
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── api/                    # API service files
│   ├── eventApi.js        # Event management APIs
│   ├── mailApi.js         # Email APIs
│   ├── personalizedMailApi.js
│   └── templateApi.js     # Template APIs
├── assets/                # Static assets
├── auth/                  # Authentication components
│   ├── AuthContext.jsx   # Auth state management
│   ├── authService.js     # Auth API calls
│   └── ProtectedRoute.jsx # Route protection
├── components/            # Reusable components
│   ├── Header.jsx         # Navigation header
│   ├── AdminToolbar.jsx   # Admin toolbar
│   └── auth/              # Auth-specific components
├── context/               # React contexts
│   ├── EventContext.jsx   # Event state management
│   └── MenuContext.jsx    # Menu state management
├── hooks/                 # Custom React hooks
├── pages/                 # Page components
│   ├── EventList.jsx      # Public event listing
│   ├── EventDetails.jsx   # Event details page
│   ├── EventForm.jsx      # Admin event creation/editing
│   ├── AdminEventList.jsx # Admin event management
│   ├── UserRegistrations.jsx # User registration history
│   ├── AdminPanel.jsx     # Admin dashboard
│   ├── UserPanel.jsx      # User dashboard
│   └── ...               # Other pages
├── App.jsx               # Main app component
├── router.jsx            # React Router configuration
└── main.jsx              # App entry point
```

## 🎨 UI/UX Design

### Design System

- **Color Palette**: Navy (#000066) and Orange (#f26b24) brand colors
- **Typography**: Inter font family for modern, clean text
- **Components**: Bootstrap 5 with custom styling
- **Icons**: React Icons for consistent iconography

### Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🔧 Key Components

### Event Management

```jsx
// Event listing with search and filters
<EventList />

// Detailed event view with registration
<EventDetails />

// Admin event creation/editing form
<EventForm />
```

### User Management

```jsx
// User registration history
<UserRegistrations />

// Admin event management dashboard
<AdminEventList />
```

### Authentication

```jsx
// Protected routes for authenticated users
<ProtectedRoute>
  <UserPanel />
</ProtectedRoute>

// Role-based protected routes
<RoleProtectedRoute role="admin">
  <AdminPanel />
</RoleProtectedRoute>
```

## 🔄 State Management

### Event Context

Manages all event-related state:

- Event listings and details
- User registrations
- Payment processing
- Error handling and loading states

### Auth Context

Handles user authentication:

- Login/logout functionality
- User session management
- Token refresh
- Protected route access

## 💳 Payment Integration

### Razorpay Setup

1. Create a Razorpay account
2. Get test/live API keys
3. Configure environment variables
4. Test payment flow

### Payment Flow

1. User selects paid event
2. Registration form submission
3. Razorpay payment modal
4. Payment verification
5. Registration confirmation

## 📧 Email Integration

### Automated Emails

- **Registration Confirmation**: Sent immediately after successful registration
- **Event Reminders**: Sent 1 day before event (configurable)
- **Certificate Notification**: Sent when certificate is issued

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-optimized interactions
- Mobile-friendly forms
- Progressive Web App (PWA) ready

## 🔐 Security Features

- JWT-based authentication
- Protected API endpoints
- Input validation and sanitization
- XSS protection
- CSRF protection via secure headers

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style

- ESLint configuration
- Consistent component structure
- Modern React patterns (hooks, functional components)
- Clean code principles

## 📦 Dependencies

### Core Dependencies

- **React 19**: Modern React with hooks
- **React Router Dom 7**: Client-side routing
- **Axios**: HTTP client for API calls
- **Bootstrap 5**: UI component framework
- **React Icons**: Icon library

### Development Dependencies

- **Vite**: Fast build tool
- **ESLint**: Code linting
- **PostCSS**: CSS processing

## 🚀 Deployment

### Build Optimization

- Automatic code splitting
- Asset optimization
- Tree shaking for smaller bundles
- Production-ready builds

### Environment Configuration

- Separate configs for development/production
- Environment variable management
- API endpoint configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API integration guide

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Advanced search and filters
- [ ] Calendar integration
- [ ] Mobile app version
- [ ] Webhook integrations

---

Built with ❤️ using React, Vite, and modern web technologies.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
