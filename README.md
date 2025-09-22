# CareGuardian Healthcare Platform 🏥

**CareGuardian** is a comprehensive healthcare platform that serves as a personal healthcare companion, providing users with tools to manage their health journey including medical records, doctor appointments, emergency services, medication tracking, and AI-powered health assistance.

## ✨ Features

### Core Healthcare Features
- **🏥 Hospital Management** - Find and connect with hospitals
- **👨‍⚕️ Doctor Directory** - Browse doctors by specialty and availability  
- **📅 Appointment Scheduling** - Book virtual and in-person consultations
- **📋 Medical Records** - Secure storage and management of health records
- **💊 Medication Tracker** - Track medications, dosages, and refill dates
- **🩺 Health Data Monitoring** - Record vital signs and health metrics

### Advanced Features
- **🚑 Hospital-on-Wheels** - Mobile healthcare services
- **🆘 First Aid Assistance** - Emergency guidance and AI-powered support
- **🥗 Diet Routine Management** - Personalized nutrition tracking
- **🎤 Voice Interaction** - Speech recognition for accessibility
- **🤖 AI Health Assistant** - OpenAI-powered symptom checker and health guidance
- **💳 Subscription Management** - Tiered payment plans with Stripe integration

### Technical Features
- **🔐 Secure Authentication** - Session-based user management
- **📱 Responsive Design** - Works on mobile, tablet, and desktop
- **🌙 Dark Mode Support** - System and manual theme switching
- **🔄 Real-time Updates** - Live data synchronization
- **☁️ Cloud Database** - PostgreSQL with Neon serverless

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **Radix UI** + **shadcn/ui** for accessible components
- **Tailwind CSS** for styling with custom theming
- **TanStack Query** for server state management
- **React Hook Form** + **Zod** for form validation
- **Vite** for fast development and builds

### Backend
- **Express.js** with TypeScript REST API
- **Passport.js** for authentication with local strategy
- **Node.js crypto** for secure password hashing
- **Express Session** with PostgreSQL session store

### Database & ORM
- **PostgreSQL** (Neon serverless database)
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for schema migrations

### External Services
- **OpenAI API** for AI-powered health assistance
- **Stripe** for payment processing
- **React Speech Recognition** for voice features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use the built-in Neon database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd careguardian
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Required environment variables:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### Default Credentials
- **Username**: `admin`
- **Password**: `admin`

## 📊 Database Schema

### Core Tables
- **users** - User profiles and authentication
- **health_data** - Vital signs and health metrics
- **medical_records** - Medical history and documents
- **doctors** - Healthcare provider directory
- **hospitals** - Hospital information and locations
- **appointments** - Appointment scheduling
- **medications** - Medication tracking and management
- **medication_logs** - Medication adherence logs
- **chat_messages** - AI chatbot conversation history

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user info

### Health Data
- `GET /api/health-data` - Get user health metrics
- `POST /api/health-data` - Record new health data

### Medical Records
- `GET /api/medical-records` - Get user medical records
- `POST /api/medical-records` - Create medical record

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Schedule appointment

### Medications
- `GET /api/medications` - Get user medications
- `POST /api/medications` - Add new medication
- `POST /api/medication-logs` - Log medication taken

### AI Features
- `POST /api/chat` - Send message to AI health assistant

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Express.js backend
│   ├── auth.ts           # Authentication logic
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database interface
│   └── openai.ts         # AI integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── README.md
```

### Database Development
- Schema changes should be made in `shared/schema.ts`
- Use `npm run db:push` to apply changes to development database
- The application uses Drizzle ORM for type-safe database operations

### Authentication Flow
- Session-based authentication with HTTP-only cookies
- Passwords are hashed using Node.js scrypt with random salt
- Protected routes automatically redirect unauthenticated users

## 🚀 Deployment

### Building for Production
```bash
npm run build
npm run start
```

### Environment Setup
Ensure all required environment variables are configured in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the documentation above
- Review the code comments and type definitions
- Create an issue for bug reports or feature requests

---

**CareGuardian** - Your Personal Healthcare Companion 💙