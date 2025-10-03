# CareGuardian Healthcare Platform

## Overview

CareGuardian is a comprehensive healthcare platform that serves as a personal healthcare companion. The application provides users with tools to manage their health journey including medical records, doctor appointments, emergency services, medication tracking, diet routines, and AI-powered health assistance. The platform features a full-stack architecture with user authentication, real-time health monitoring, and integrated payment systems for subscription-based services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing with protected routes for authenticated users
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Password Security**: Node.js crypto module with scrypt for secure password hashing
- **Session Management**: Express-session with PostgreSQL session store for persistent sessions
- **API Design**: RESTful endpoints with consistent error handling and logging middleware

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Centralized schema definitions in TypeScript with Zod validation
- **Connection**: Connection pooling with @neondatabase/serverless for optimal performance

### Database Schema Design
The application uses a relational database structure with the following key entities:
- **Users**: Core user profiles with authentication credentials, personal information, and role assignments (patient, ambulance)
- **Health Data**: Time-series health metrics (heart rate, blood pressure, glucose, temperature)
- **Medical Records**: Document storage for medical history and reports
- **Appointments**: Scheduling system for doctor consultations (virtual and in-person) with status tracking
- **Medications**: Prescription tracking and medication management
- **Doctors/Hospitals**: Provider directory with specialties and contact information
- **Ambulances**: Emergency vehicle fleet with location tracking and driver assignment via userId
- **Ambulance Bookings**: Patient ambulance requests with status tracking and location details
- **Chat Messages**: AI chatbot conversation history

### Authentication and Authorization
- **Session-based Authentication**: Secure session management with HTTP-only cookies
- **Password Security**: Salted and hashed passwords using industry-standard scrypt algorithm
- **Protected Routes**: Frontend route protection with automatic redirection for unauthenticated users
- **Role-based Access Control**: Different user interfaces and API endpoints based on user role (patient vs ambulance driver)
- **CSRF Protection**: Same-site cookie configuration for cross-site request forgery protection

### AI Integration
- **OpenAI Integration**: GPT-4 powered features for symptom analysis and health guidance
- **Symptom Checker**: AI-driven analysis of user symptoms with risk assessment
- **Chatbot**: Conversational AI for health queries and first aid guidance
- **Health Analytics**: Predictive health insights based on user data patterns

### Payment System Architecture
- **Stripe Integration**: Secure payment processing for subscription plans
- **Subscription Management**: Tiered pricing model (Basic, Premium, Enterprise)
- **Payment Security**: PCI-DSS compliant payment handling through Stripe

### Emergency Services System
- **Ambulance Fleet Management**: Real-time tracking and status management of ambulance vehicles
- **Driver Portal**: Dedicated dashboard for ambulance drivers to manage bookings and update locations
- **Geolocation Integration**: Browser-based geolocation API for real-time position tracking
- **Booking System**: Patient ambulance requests with pickup/dropoff addresses and medical condition details
- **Status Workflow**: Pending → Accepted → Completed booking lifecycle with driver controls

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for the backend API
- **react**: Frontend user interface library
- **@tanstack/react-query**: Server state management and caching

### Authentication and Security
- **passport**: Authentication middleware with local strategy
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store
- **crypto**: Node.js built-in module for password hashing

### UI and Design System
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library for consistent iconography

### Development and Build Tools
- **vite**: Modern build tool and development server
- **typescript**: Static type checking and enhanced developer experience
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds

### Form Handling and Validation
- **react-hook-form**: Performance-focused form library
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation and schema definition

### AI and Voice Features
- **openai**: Official OpenAI API client for GPT integration
- **react-speech-recognition**: Browser speech recognition API wrapper

### Payment Processing
- **@stripe/stripe-js**: Stripe JavaScript SDK
- **@stripe/react-stripe-js**: React components for Stripe integration

### Additional Utilities
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: Unique ID generation