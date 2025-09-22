import { 
  users, doctors, hospitals, healthData, medicalRecords, appointments, chatMessages,
  medications, medicationLogs,
  type User, type InsertUser, type HealthData, type MedicalRecord, 
  type Appointment, type ChatMessage, type Doctor, type Hospital, 
  type Medication, type MedicationLog,
  type InsertHealthData, type InsertMedicalRecord, type InsertAppointment, 
  type InsertChatMessage, type InsertMedication, type InsertMedicationLog
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
  
  // Medications
  getUserMedications(userId: number): Promise<Medication[]>;
  getUserActiveMedications(userId: number): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  toggleMedicationStatus(id: number, active: boolean): Promise<Medication | undefined>;
  getMedicationLogs(medicationId: number): Promise<MedicationLog[]>;
  createMedicationLog(log: InsertMedicationLog): Promise<MedicationLog>;
  
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
  
  // Medication management
  async getUserMedications(userId: number): Promise<Medication[]> {
    return await db.select().from(medications).where(eq(medications.userId, userId));
  }
  
  async getUserActiveMedications(userId: number): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(and(
        eq(medications.userId, userId),
        eq(medications.active, true)
      ));
  }
  
  async getMedication(id: number): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }
  
  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db.insert(medications).values(medication).returning();
    return newMedication;
  }
  
  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updatedMedication] = await db
      .update(medications)
      .set(medication)
      .where(eq(medications.id, id))
      .returning();
      
    return updatedMedication;
  }
  
  async toggleMedicationStatus(id: number, active: boolean): Promise<Medication | undefined> {
    const [updatedMedication] = await db
      .update(medications)
      .set({ active })
      .where(eq(medications.id, id))
      .returning();
      
    return updatedMedication;
  }
  
  async getMedicationLogs(medicationId: number): Promise<MedicationLog[]> {
    return await db
      .select()
      .from(medicationLogs)
      .where(eq(medicationLogs.medicationId, medicationId))
      .orderBy(desc(medicationLogs.takenAt));
  }
  
  async createMedicationLog(log: InsertMedicationLog): Promise<MedicationLog> {
    const [newLog] = await db.insert(medicationLogs).values(log).returning();
    return newLog;
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
            name: "Dr. Arun Kumar",
            specialty: "Cardiologist",
            hospital: "Manipal Hospital",
            phoneNumber: "+91 80 2502 4444",
            email: "dr.arun@manipalhospital.com",
            profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
            availableDays: ["Monday", "Wednesday", "Friday"],
            rating: 4
          },
          {
            name: "Dr. Priya Sharma",
            specialty: "Dermatologist",
            hospital: "Fortis Hospital",
            phoneNumber: "+91 80 6621 4444",
            email: "dr.priya@fortis.com",
            profileImage: "https://randomuser.me/api/portraits/women/2.jpg",
            availableDays: ["Tuesday", "Thursday", "Saturday"],
            rating: 5
          },
          {
            name: "Dr. Rajesh Patel",
            specialty: "Neurologist",
            hospital: "Apollo Hospital",
            phoneNumber: "+91 80 4612 3000",
            email: "dr.rajesh@apollohospitals.com",
            profileImage: "https://randomuser.me/api/portraits/men/3.jpg",
            availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
            rating: 4
          },
          {
            name: "Dr. Meera Iyer",
            specialty: "Orthopedic Surgeon",
            hospital: "Narayana Hrudayalaya",
            phoneNumber: "+91 80 7122 2222",
            email: "dr.meera@narayanahospital.com",
            profileImage: "https://randomuser.me/api/portraits/women/4.jpg",
            availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
            rating: 5
          },
          {
            name: "Dr. Suresh Reddy",
            specialty: "General Physician",
            hospital: "Aster CMI Hospital",
            phoneNumber: "+91 80 4342 0100",
            email: "dr.suresh@asterhospital.com",
            profileImage: "https://randomuser.me/api/portraits/men/5.jpg",
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
            name: "Manipal Hospital",
            address: "98, HAL Airport Road, Bengaluru, Karnataka 560017",
            phoneNumber: "+91 80 2502 4444",
            email: "info@manipalhospitals.com",
            logo: "https://via.placeholder.com/150",
            rating: 4,
            latitude: "12.9582",
            longitude: "77.6484"
          },
          {
            name: "Fortis Hospital",
            address: "154/9, Bannerghatta Road, Bengaluru, Karnataka 560076",
            phoneNumber: "+91 80 6621 4444",
            email: "info@fortishospital.com",
            logo: "https://via.placeholder.com/150",
            rating: 4,
            latitude: "12.8913",
            longitude: "77.5979"
          },
          {
            name: "Apollo Hospital",
            address: "154/11, Bannerghatta Road, Bengaluru, Karnataka 560076",
            phoneNumber: "+91 80 4612 3000",
            email: "info@apollohospitals.com",
            logo: "https://via.placeholder.com/150",
            rating: 5,
            latitude: "12.8908",
            longitude: "77.5981"
          },
          {
            name: "Narayana Hrudayalaya",
            address: "258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru, Karnataka 560099",
            phoneNumber: "+91 80 7122 2222",
            email: "info@narayanahospital.com",
            logo: "https://via.placeholder.com/150",
            rating: 5,
            latitude: "12.8018",
            longitude: "77.6966"
          },
          {
            name: "Aster CMI Hospital",
            address: "No. 43/2, New Airport Road, NH 44, Bengaluru, Karnataka 560064",
            phoneNumber: "+91 80 4342 0100",
            email: "info@asterhospital.com",
            logo: "https://via.placeholder.com/150",
            rating: 4,
            latitude: "13.0642",
            longitude: "77.5940"
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
