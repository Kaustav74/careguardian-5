import { users, type User, type InsertUser, type HealthData, type MedicalRecord, type Appointment, type ChatMessage, type Doctor, type Hospital, type InsertHealthData, type InsertMedicalRecord, type InsertAppointment, type InsertChatMessage } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

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
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private healthData: Map<number, HealthData>;
  private medicalRecords: Map<number, MedicalRecord>;
  private doctors: Map<number, Doctor>;
  private hospitals: Map<number, Hospital>;
  private appointments: Map<number, Appointment>;
  private chatMessages: Map<number, ChatMessage>;
  
  currentUserId: number;
  currentHealthDataId: number;
  currentMedicalRecordId: number;
  currentDoctorId: number;
  currentHospitalId: number;
  currentAppointmentId: number;
  currentChatMessageId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.healthData = new Map();
    this.medicalRecords = new Map();
    this.doctors = new Map();
    this.hospitals = new Map();
    this.appointments = new Map();
    this.chatMessages = new Map();
    
    this.currentUserId = 1;
    this.currentHealthDataId = 1;
    this.currentMedicalRecordId = 1;
    this.currentDoctorId = 1;
    this.currentHospitalId = 1;
    this.currentAppointmentId = 1;
    this.currentChatMessageId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create admin user
    const adminId = this.currentUserId++;
    const adminUser: User = {
      id: adminId,
      username: "admin",
      password: "admin", // In a real app, this would be hashed
      email: "admin@careguardian.com",
      fullName: "Admin User",
      profileImage: "",
      phone: "123-456-7890",
      address: "123 Admin St",
      dateOfBirth: new Date("1990-01-01").toISOString(),
    };
    this.users.set(adminId, adminUser);
    
    // Seed some initial data for doctors and hospitals
    this.seedInitialData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getUserHealthData(userId: number): Promise<HealthData[]> {
    return Array.from(this.healthData.values()).filter(
      (data) => data.userId === userId,
    );
  }
  
  async createHealthData(data: InsertHealthData): Promise<HealthData> {
    const id = this.currentHealthDataId++;
    const recordedAt = new Date();
    const healthData: HealthData = { ...data, id, recordedAt };
    this.healthData.set(id, healthData);
    return healthData;
  }
  
  async getLatestHealthData(userId: number): Promise<HealthData | undefined> {
    const userHealthData = await this.getUserHealthData(userId);
    if (userHealthData.length === 0) return undefined;
    
    return userHealthData.reduce((latest, current) => 
      latest.recordedAt > current.recordedAt ? latest : current
    );
  }
  
  async getUserMedicalRecords(userId: number): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(
      (record) => record.userId === userId,
    );
  }
  
  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = this.currentMedicalRecordId++;
    const medicalRecord: MedicalRecord = { ...record, id };
    this.medicalRecords.set(id, medicalRecord);
    return medicalRecord;
  }
  
  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }
  
  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }
  
  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }
  
  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }
  
  async getHospital(id: number): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }
  
  async getUserAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId,
    );
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const newAppointment: Appointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, status };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async getUserChatHistory(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.userId === userId,
    );
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const timestamp = new Date();
    const chatMessage: ChatMessage = { ...message, id, timestamp };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  private seedInitialData() {
    // Seed doctors
    const doctors: Doctor[] = [
      {
        id: this.currentDoctorId++,
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
        id: this.currentDoctorId++,
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
        id: this.currentDoctorId++,
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
    
    doctors.forEach(doctor => this.doctors.set(doctor.id, doctor));
    
    // Seed hospitals
    const hospitals: Hospital[] = [
      {
        id: this.currentHospitalId++,
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
        id: this.currentHospitalId++,
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
        id: this.currentHospitalId++,
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
    
    hospitals.forEach(hospital => this.hospitals.set(hospital.id, hospital));
  }
}

export const storage = new MemStorage();
