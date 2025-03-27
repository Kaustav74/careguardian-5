import { 
  users, doctors, hospitals, healthData, medicalRecords, appointments, chatMessages,
  type User, type InsertUser, type HealthData, type MedicalRecord, 
  type Appointment, type ChatMessage, type Doctor, type Hospital, 
  type InsertHealthData, type InsertMedicalRecord, type InsertAppointment, type InsertChatMessage 
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import pg from "pg";

const { Pool } = pg;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Health Data
  getUserHealthData(userId: number): Promise<HealthData[]>;
  createHealthData(data: InsertHealthData): Promise<HealthData>;
  getLatestHealthData(userId: number): Promise<HealthData | undefined>;
  
  // Medical Records
  getUserMedicalRecords(userId: number): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  
  // Doctors
  getAllDoctors(): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  
  // Hospitals
  getAllHospitals(): Promise<Hospital[]>;
  getHospital(id: number): Promise<Hospital | undefined>;
  
  // Appointments
  getUserAppointments(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  
  // Chat
  getUserChatHistory(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  sessionStore: any; // Using any for session store type
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for SessionStore to avoid type issues
  
  constructor() {
    // Create a new connection pool for the session store
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true
    });
    
    // Seed initial data
    this.seedInitialData();
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getUserHealthData(userId: number): Promise<HealthData[]> {
    return await db.select().from(healthData).where(eq(healthData.userId, userId));
  }
  
  async createHealthData(data: InsertHealthData): Promise<HealthData> {
    const [newHealthData] = await db.insert(healthData).values(data).returning();
    return newHealthData;
  }
  
  async getLatestHealthData(userId: number): Promise<HealthData | undefined> {
    const [latestData] = await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.recordedAt))
      .limit(1);
      
    return latestData;
  }
  
  async getUserMedicalRecords(userId: number): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords).where(eq(medicalRecords.userId, userId));
  }
  
  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [newRecord] = await db.insert(medicalRecords).values(record).returning();
    return newRecord;
  }
  
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
    return record;
  }
  
  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors);
  }
  
  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }
  
  async getAllHospitals(): Promise<Hospital[]> {
    return await db.select().from(hospitals);
  }
  
  async getHospital(id: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }
  
  async getUserAppointments(userId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }
  
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
      
    return updatedAppointment;
  }
  
  async getUserChatHistory(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
  
  private async seedInitialData() {
    try {
      // Check if admin user exists, if not create it
      const adminExists = await this.getUserByUsername("admin");
      if (!adminExists) {
        console.log("Admin user not found. Creating admin user...");
        
        // Import the hash function from auth.ts to hash the password
        const { hashPassword } = await import("./auth"); 
        
        // Create the admin user with a properly hashed password
        await this.createUser({
          username: "admin",
          password: await hashPassword("admin"),
          email: "admin@careguardian.com",
          fullName: "Admin User",
          phoneNumber: "123-456-7890"
        });
        
        console.log("Admin user created successfully.");
      }
      
      // Check if any doctors exist, if not create them
      const existingDoctors = await this.getAllDoctors();
      if (existingDoctors.length === 0) {
        console.log("No doctors found. Seeding doctor data...");
        
        const doctorData = [
          {
            name: "Dr. Michael Chen",
            specialty: "Cardiologist",
            hospital: "City Medical Center",
            phoneNumber: "(312) 555-1234",
            email: "dr.chen@citymedical.com",
            profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
            availableDays: ["Monday", "Wednesday", "Friday"],
            rating: 4
          },
          {
            name: "Dr. Sarah Williams",
            specialty: "Dermatologist",
            hospital: "Memorial Hospital",
            phoneNumber: "(312) 555-5678",
            email: "dr.williams@memorial.com",
            profileImage: "https://randomuser.me/api/portraits/women/2.jpg",
            availableDays: ["Tuesday", "Thursday"],
            rating: 5
          },
          {
            name: "Dr. James Wilson",
            specialty: "Neurologist",
            hospital: "University Medical Center",
            phoneNumber: "(312) 555-9012",
            email: "dr.wilson@umc.com",
            profileImage: "https://randomuser.me/api/portraits/men/3.jpg",
            availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            rating: 4
          }
        ];
        
        for (const doctor of doctorData) {
          await db.insert(doctors).values(doctor);
        }
        
        console.log("Doctor data seeded successfully.");
      }
      
      // Check if any hospitals exist, if not create them
      const existingHospitals = await this.getAllHospitals();
      if (existingHospitals.length === 0) {
        console.log("No hospitals found. Seeding hospital data...");
        
        const hospitalData = [
          {
            name: "City Medical Center",
            address: "123 Medical Ave, Chicago, IL",
            phoneNumber: "(312) 555-1234",
            email: "info@citymedical.com",
            logo: "https://via.placeholder.com/150",
            rating: 4,
            latitude: "41.8781",
            longitude: "-87.6298"
          },
          {
            name: "Memorial Hospital",
            address: "456 Health Blvd, Chicago, IL",
            phoneNumber: "(312) 555-6789",
            email: "info@memorial.com",
            logo: "https://via.placeholder.com/150",
            rating: 4,
            latitude: "41.8789",
            longitude: "-87.6350"
          },
          {
            name: "University Medical Center",
            address: "789 University Way, Chicago, IL",
            phoneNumber: "(312) 555-9876",
            email: "info@umc.com",
            logo: "https://via.placeholder.com/150",
            rating: 5,
            latitude: "41.8702",
            longitude: "-87.6310"
          }
        ];
        
        for (const hospital of hospitalData) {
          await db.insert(hospitals).values(hospital);
        }
        
        console.log("Hospital data seeded successfully.");
      }
    } catch (error) {
      console.error("Error seeding initial data:", error);
    }
  }
}

export const storage = new DatabaseStorage();
