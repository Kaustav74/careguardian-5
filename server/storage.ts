import { 
  users, doctors, hospitals, healthData, medicalRecords, appointments, chatMessages,
  medications, medicationLogs, dietDays, dietMeals, dietMealItems,
  departments, doctorAvailability, doctorLeaves, homeVisitRequests, emergencyIncidents, ambulances, ambulanceBookings,
  symptomChecks, fitnessData,
  type User, type InsertUser, type HealthData, type MedicalRecord, 
  type Appointment, type ChatMessage, type Doctor, type Hospital, 
  type Medication, type MedicationLog, type DietDay, type DietMeal, type DietMealItem,
  type Department, type DoctorAvailability, type DoctorLeave, type HomeVisitRequest,
  type EmergencyIncident, type Ambulance, type AmbulanceBooking,
  type SymptomCheck, type FitnessData,
  type InsertHealthData, type InsertMedicalRecord, type InsertAppointment, 
  type InsertChatMessage, type InsertMedication, type InsertMedicationLog,
  type InsertDietDay, type InsertDietMeal, type InsertDietMealItem,
  type InsertHomeVisitRequest, type InsertEmergencyIncident, type InsertAmbulanceBooking,
  type InsertSymptomCheck, type InsertFitnessData,
  type InsertDoctor, type InsertHospital
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
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
  getDoctorsByHospital(hospitalId: number): Promise<Doctor[]>;
  getDoctorsByDepartment(department: string): Promise<Doctor[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  updateDoctorAvailabilityStatus(doctorId: number, status: string): Promise<Doctor | undefined>;
  
  // Hospitals
  getAllHospitals(): Promise<Hospital[]>;
  getHospital(id: number): Promise<Hospital | undefined>;
  getHospitalByEmail(email: string): Promise<Hospital | undefined>;
  getHospitalByUserId(userId: number): Promise<Hospital | undefined>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: number, hospital: Partial<InsertHospital>): Promise<Hospital | undefined>;
  searchHospitalsByCity(city: string): Promise<Hospital[]>;
  searchHospitalsByLocation(latitude: number, longitude: number, maxDistance: number): Promise<any[]>;
  updateUserLocation(userId: number, city: string, state: string, latitude: string, longitude: string): Promise<User | undefined>;
  
  // Appointments
  getUserAppointments(userId: number): Promise<Appointment[]>;
  getUserAppointmentsWithDetails(userId: number): Promise<any[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  cancelAppointment(id: number, userId: number): Promise<boolean>;
  rescheduleAppointment(id: number, userId: number, newDate: Date, newTime: string): Promise<Appointment | undefined>;
  
  // Departments
  getAllDepartments(): Promise<Department[]>;
  getDepartmentsByHospital(hospitalId: number): Promise<Department[]>;
  
  // Doctor Availability & Leaves
  getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]>;
  getDoctorLeaves(doctorId: number): Promise<DoctorLeave[]>;
  isDoctorAvailable(doctorId: number, date: Date): Promise<boolean>;
  
  // Home Visit Requests
  createHomeVisitRequest(request: InsertHomeVisitRequest): Promise<HomeVisitRequest>;
  getUserHomeVisitRequests(userId: number): Promise<HomeVisitRequest[]>;
  updateHomeVisitRequestStatus(id: number, status: string, assignedHospitalId?: number, assignedDoctorId?: number): Promise<HomeVisitRequest | undefined>;
  
  // Emergency Incidents
  createEmergencyIncident(incident: InsertEmergencyIncident): Promise<EmergencyIncident>;
  getEmergencyIncident(id: number): Promise<EmergencyIncident | undefined>;
  updateEmergencyIncidentStatus(id: number, status: string, ambulanceId?: number, hospitalId?: number): Promise<EmergencyIncident | undefined>;
  getUserEmergencyIncidents(userId: number): Promise<EmergencyIncident[]>;
  
  // Ambulances
  getAvailableAmbulances(): Promise<Ambulance[]>;
  getNearestAvailableAmbulance(latitude: string, longitude: string): Promise<Ambulance | undefined>;
  updateAmbulanceStatus(id: number, status: string, latitude?: string, longitude?: string): Promise<Ambulance | undefined>;
  searchAmbulances(latitude: number, longitude: number, maxDistance: number): Promise<any[]>;
  
  // Ambulance Bookings
  createAmbulanceBooking(booking: InsertAmbulanceBooking): Promise<AmbulanceBooking>;
  getUserAmbulanceBookings(userId: number): Promise<AmbulanceBooking[]>;
  updateAmbulanceBookingStatus(id: number, status: string): Promise<AmbulanceBooking | undefined>;
  
  // Ambulance Driver Operations
  getAmbulanceByUserId(userId: number): Promise<Ambulance | undefined>;
  getAmbulanceBookingsByAmbulanceId(ambulanceId: number): Promise<AmbulanceBooking[]>;
  updateAmbulanceLocation(id: number, latitude: string, longitude: string): Promise<Ambulance | undefined>;
  
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
  
  // Diet
  getUserDietDay(userId: number, date: string): Promise<DietDay | undefined>;
  createDietDay(dietDay: InsertDietDay): Promise<DietDay>;
  updateDietDay(id: number, dietDay: Partial<InsertDietDay>): Promise<DietDay | undefined>;
  getDietMeals(dietDayId: number): Promise<DietMeal[]>;
  createDietMeal(meal: InsertDietMeal): Promise<DietMeal>;
  updateDietMeal(id: number, meal: Partial<InsertDietMeal>): Promise<DietMeal | undefined>;
  deleteDietMeal(id: number): Promise<void>;
  getDietMealItems(mealId: number): Promise<DietMealItem[]>;
  createDietMealItem(item: InsertDietMealItem): Promise<DietMealItem>;
  deleteDietMealItem(id: number): Promise<void>;
  
  // Symptom Checker
  createSymptomCheck(check: InsertSymptomCheck): Promise<SymptomCheck>;
  getUserSymptomChecks(userId: number): Promise<SymptomCheck[]>;
  getSymptomCheck(id: number): Promise<SymptomCheck | undefined>;
  
  // Fitness Data
  createFitnessData(data: InsertFitnessData): Promise<FitnessData>;
  getUserFitnessData(userId: number): Promise<FitnessData[]>;
  getUserFitnessDataByDateRange(userId: number, startDate: Date, endDate: Date): Promise<FitnessData[]>;
  getLatestFitnessData(userId: number): Promise<FitnessData | undefined>;
  
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

  async getDoctorsByHospital(hospitalId: number): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.hospitalId, hospitalId));
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    return await db.select().from(doctors).where(eq(doctors.department, department));
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }

  async updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const [updated] = await db.update(doctors).set(doctor).where(eq(doctors.id, id)).returning();
    return updated;
  }

  async updateDoctorAvailabilityStatus(doctorId: number, status: string): Promise<Doctor | undefined> {
    const [updated] = await db.update(doctors)
      .set({ availabilityStatus: status })
      .where(eq(doctors.id, doctorId))
      .returning();
    return updated;
  }
  
  async getAllHospitals(): Promise<Hospital[]> {
    return await db.select().from(hospitals);
  }
  
  async getHospital(id: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

  async getHospitalByEmail(email: string): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.email, email));
    return hospital;
  }

  async getHospitalByUserId(userId: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.userId, userId));
    return hospital;
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const [newHospital] = await db.insert(hospitals).values(hospital).returning();
    return newHospital;
  }

  async updateHospital(id: number, hospital: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const [updatedHospital] = await db
      .update(hospitals)
      .set(hospital)
      .where(eq(hospitals.id, id))
      .returning();
    return updatedHospital;
  }

  async searchHospitalsByCity(city: string): Promise<Hospital[]> {
    return await db.select().from(hospitals).where(eq(hospitals.city, city));
  }

  async searchHospitalsByLocation(latitude: number, longitude: number, maxDistance: number): Promise<any[]> {
    // Import sql from drizzle-orm at the top if not already imported
    const { calculateDistance } = await import('./utils/distance.js');
    
    const allHospitals = await db.select().from(hospitals);
    
    const hospitalsWithDistance = allHospitals
      .filter(hospital => hospital.latitude && hospital.longitude)
      .map(hospital => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(hospital.latitude!),
          parseFloat(hospital.longitude!)
        );
        return { ...hospital, distance };
      })
      .filter(hospital => hospital.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
    
    return hospitalsWithDistance;
  }

  async updateUserLocation(userId: number, city: string, state: string, latitude: string, longitude: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ city, state, latitude, longitude })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async getUserAppointments(userId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }
  
  async getUserAppointmentsWithDetails(userId: number): Promise<any[]> {
    const userAppointments = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        doctorId: appointments.doctorId,
        hospitalId: appointments.hospitalId,
        date: appointments.date,
        time: appointments.time,
        isVirtual: appointments.isVirtual,
        status: appointments.status,
        notes: appointments.notes,
        doctorName: doctors.name,
        doctorSpecialty: doctors.specialty,
        doctorPhoneNumber: doctors.phoneNumber,
        doctorEmail: doctors.email,
        doctorProfileImage: doctors.profileImage,
        hospitalName: hospitals.name,
        hospitalAddress: hospitals.address,
        hospitalPhoneNumber: hospitals.phoneNumber,
      })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .leftJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.date));
      
    return userAppointments;
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
  
  async getUserDietDay(userId: number, date: string): Promise<DietDay | undefined> {
    const [dietDay] = await db
      .select()
      .from(dietDays)
      .where(and(
        eq(dietDays.userId, userId),
        eq(dietDays.date, date)
      ));
    return dietDay;
  }
  
  async createDietDay(dietDay: InsertDietDay): Promise<DietDay> {
    const [newDietDay] = await db.insert(dietDays).values(dietDay).returning();
    return newDietDay;
  }
  
  async updateDietDay(id: number, dietDay: Partial<InsertDietDay>): Promise<DietDay | undefined> {
    const [updatedDietDay] = await db
      .update(dietDays)
      .set(dietDay)
      .where(eq(dietDays.id, id))
      .returning();
    return updatedDietDay;
  }
  
  async getDietMeals(dietDayId: number): Promise<DietMeal[]> {
    return await db
      .select()
      .from(dietMeals)
      .where(eq(dietMeals.dietDayId, dietDayId));
  }
  
  async createDietMeal(meal: InsertDietMeal): Promise<DietMeal> {
    const [newMeal] = await db.insert(dietMeals).values(meal).returning();
    return newMeal;
  }
  
  async updateDietMeal(id: number, meal: Partial<InsertDietMeal>): Promise<DietMeal | undefined> {
    const [updatedMeal] = await db
      .update(dietMeals)
      .set(meal)
      .where(eq(dietMeals.id, id))
      .returning();
    return updatedMeal;
  }
  
  async deleteDietMeal(id: number): Promise<void> {
    await db.delete(dietMeals).where(eq(dietMeals.id, id));
  }
  
  async getDietMealItems(mealId: number): Promise<DietMealItem[]> {
    return await db
      .select()
      .from(dietMealItems)
      .where(eq(dietMealItems.dietMealId, mealId));
  }
  
  async createDietMealItem(item: InsertDietMealItem): Promise<DietMealItem> {
    const [newItem] = await db.insert(dietMealItems).values(item).returning();
    return newItem;
  }
  
  async deleteDietMealItem(id: number): Promise<void> {
    await db.delete(dietMealItems).where(eq(dietMealItems.id, id));
  }
  
  // Appointment management
  async cancelAppointment(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
      .returning();
    return result.length > 0;
  }
  
  async rescheduleAppointment(id: number, userId: number, newDate: Date, newTime: string): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ date: newDate, time: newTime, updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
      .returning();
    return updatedAppointment;
  }
  
  // Departments
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }
  
  async getDepartmentsByHospital(hospitalId: number): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.hospitalId, hospitalId));
  }
  
  // Doctor Availability & Leaves
  async getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    return await db.select().from(doctorAvailability).where(eq(doctorAvailability.doctorId, doctorId));
  }
  
  async getDoctorLeaves(doctorId: number): Promise<DoctorLeave[]> {
    return await db.select().from(doctorLeaves).where(eq(doctorLeaves.doctorId, doctorId));
  }
  
  async isDoctorAvailable(doctorId: number, date: Date): Promise<boolean> {
    const leaves = await db
      .select()
      .from(doctorLeaves)
      .where(and(
        eq(doctorLeaves.doctorId, doctorId),
        eq(doctorLeaves.startDate, date)
      ));
    return leaves.length === 0;
  }
  
  // Home Visit Requests
  async createHomeVisitRequest(request: InsertHomeVisitRequest): Promise<HomeVisitRequest> {
    const [newRequest] = await db.insert(homeVisitRequests).values(request).returning();
    return newRequest;
  }
  
  async getUserHomeVisitRequests(userId: number): Promise<HomeVisitRequest[]> {
    return await db.select().from(homeVisitRequests).where(eq(homeVisitRequests.userId, userId));
  }
  
  async updateHomeVisitRequestStatus(
    id: number, 
    status: string, 
    assignedHospitalId?: number, 
    assignedDoctorId?: number
  ): Promise<HomeVisitRequest | undefined> {
    const updateData: any = { status };
    if (assignedHospitalId) updateData.assignedHospitalId = assignedHospitalId;
    if (assignedDoctorId) updateData.assignedDoctorId = assignedDoctorId;
    
    const [updated] = await db
      .update(homeVisitRequests)
      .set(updateData)
      .where(eq(homeVisitRequests.id, id))
      .returning();
    return updated;
  }
  
  // Emergency Incidents
  async createEmergencyIncident(incident: InsertEmergencyIncident): Promise<EmergencyIncident> {
    const [newIncident] = await db.insert(emergencyIncidents).values(incident).returning();
    return newIncident;
  }
  
  async getEmergencyIncident(id: number): Promise<EmergencyIncident | undefined> {
    const [incident] = await db.select().from(emergencyIncidents).where(eq(emergencyIncidents.id, id));
    return incident;
  }
  
  async updateEmergencyIncidentStatus(
    id: number, 
    status: string, 
    ambulanceId?: number, 
    hospitalId?: number
  ): Promise<EmergencyIncident | undefined> {
    const updateData: any = { status };
    if (ambulanceId !== undefined) updateData.assignedAmbulanceId = ambulanceId;
    if (hospitalId !== undefined) updateData.assignedHospitalId = hospitalId;
    if (status === 'dispatched') updateData.dispatchedAt = new Date();
    if (status === 'arrived') updateData.arrivedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();
    
    const [updated] = await db
      .update(emergencyIncidents)
      .set(updateData)
      .where(eq(emergencyIncidents.id, id))
      .returning();
    return updated;
  }
  
  async getUserEmergencyIncidents(userId: number): Promise<EmergencyIncident[]> {
    return await db.select().from(emergencyIncidents).where(eq(emergencyIncidents.userId, userId)).orderBy(desc(emergencyIncidents.createdAt));
  }
  
  // Ambulances
  async getAvailableAmbulances(): Promise<Ambulance[]> {
    return await db.select().from(ambulances).where(eq(ambulances.status, 'available'));
  }
  
  async getNearestAvailableAmbulance(latitude: string, longitude: string): Promise<Ambulance | undefined> {
    const availableAmbulances = await this.getAvailableAmbulances();
    if (availableAmbulances.length === 0) return undefined;
    
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    
    let nearestAmbulance = availableAmbulances[0];
    let minDistance = Infinity;
    
    for (const ambulance of availableAmbulances) {
      if (ambulance.currentLatitude && ambulance.currentLongitude) {
        const ambLat = parseFloat(ambulance.currentLatitude);
        const ambLon = parseFloat(ambulance.currentLongitude);
        const distance = Math.sqrt(
          Math.pow(userLat - ambLat, 2) + Math.pow(userLon - ambLon, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestAmbulance = ambulance;
        }
      }
    }
    
    return nearestAmbulance;
  }
  
  async updateAmbulanceStatus(
    id: number, 
    status: string, 
    latitude?: string, 
    longitude?: string
  ): Promise<Ambulance | undefined> {
    const updateData: any = { status };
    if (latitude) updateData.currentLatitude = latitude;
    if (longitude) updateData.currentLongitude = longitude;
    
    const [updated] = await db
      .update(ambulances)
      .set(updateData)
      .where(eq(ambulances.id, id))
      .returning();
    return updated;
  }
  
  async createAmbulanceBooking(booking: InsertAmbulanceBooking): Promise<AmbulanceBooking> {
    const [newBooking] = await db.insert(ambulanceBookings).values(booking).returning();
    return newBooking;
  }
  
  async getUserAmbulanceBookings(userId: number): Promise<AmbulanceBooking[]> {
    return await db.select().from(ambulanceBookings).where(eq(ambulanceBookings.userId, userId)).orderBy(desc(ambulanceBookings.createdAt));
  }
  
  async updateAmbulanceBookingStatus(id: number, status: string): Promise<AmbulanceBooking | undefined> {
    const [updated] = await db
      .update(ambulanceBookings)
      .set({ status })
      .where(eq(ambulanceBookings.id, id))
      .returning();
    return updated;
  }
  
  async getAmbulanceByUserId(userId: number): Promise<Ambulance | undefined> {
    const [ambulance] = await db.select().from(ambulances).where(eq(ambulances.userId, userId));
    return ambulance;
  }
  
  async getAmbulanceBookingsByAmbulanceId(ambulanceId: number): Promise<AmbulanceBooking[]> {
    return await db.select().from(ambulanceBookings)
      .where(eq(ambulanceBookings.ambulanceId, ambulanceId))
      .orderBy(desc(ambulanceBookings.createdAt));
  }
  
  async updateAmbulanceLocation(id: number, latitude: string, longitude: string): Promise<Ambulance | undefined> {
    const [updated] = await db
      .update(ambulances)
      .set({ currentLatitude: latitude, currentLongitude: longitude })
      .where(eq(ambulances.id, id))
      .returning();
    return updated;
  }
  
  async searchAmbulances(latitude: number, longitude: number, maxDistance: number): Promise<any[]> {
    const { calculateDistance } = await import("./utils/distance");
    
    const availableAmbulances = await db
      .select({
        id: ambulances.id,
        vehicleNumber: ambulances.vehicleNumber,
        status: ambulances.status,
        currentLatitude: ambulances.currentLatitude,
        currentLongitude: ambulances.currentLongitude,
        userId: ambulances.userId,
        driverName: users.fullName,
        driverPhone: users.phoneNumber,
      })
      .from(ambulances)
      .leftJoin(users, eq(ambulances.userId, users.id))
      .where(eq(ambulances.status, 'available'));
    
    const ambulancesWithDistance = availableAmbulances
      .filter(amb => amb.currentLatitude && amb.currentLongitude)
      .map(amb => {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(amb.currentLatitude!),
          parseFloat(amb.currentLongitude!)
        );
        return {
          ...amb,
          distance,
        };
      })
      .filter(amb => amb.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
    
    return ambulancesWithDistance;
  }
  
  // Symptom Checker
  async createSymptomCheck(check: InsertSymptomCheck): Promise<SymptomCheck> {
    const [newCheck] = await db.insert(symptomChecks).values(check).returning();
    return newCheck;
  }
  
  async getUserSymptomChecks(userId: number): Promise<SymptomCheck[]> {
    return await db.select().from(symptomChecks)
      .where(eq(symptomChecks.userId, userId))
      .orderBy(desc(symptomChecks.createdAt));
  }
  
  async getSymptomCheck(id: number): Promise<SymptomCheck | undefined> {
    const [check] = await db.select().from(symptomChecks).where(eq(symptomChecks.id, id));
    return check;
  }
  
  // Fitness Data
  async createFitnessData(data: InsertFitnessData): Promise<FitnessData> {
    const [newData] = await db.insert(fitnessData).values(data).returning();
    return newData;
  }
  
  async getUserFitnessData(userId: number): Promise<FitnessData[]> {
    return await db.select().from(fitnessData)
      .where(eq(fitnessData.userId, userId))
      .orderBy(desc(fitnessData.date));
  }
  
  async getUserFitnessDataByDateRange(userId: number, startDate: Date, endDate: Date): Promise<FitnessData[]> {
    return await db.select().from(fitnessData)
      .where(
        and(
          eq(fitnessData.userId, userId),
          gte(fitnessData.date, startDate),
          lte(fitnessData.date, endDate)
        )
      )
      .orderBy(desc(fitnessData.date));
  }
  
  async getLatestFitnessData(userId: number): Promise<FitnessData | undefined> {
    const [latest] = await db.select().from(fitnessData)
      .where(eq(fitnessData.userId, userId))
      .orderBy(desc(fitnessData.date))
      .limit(1);
    return latest;
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
          phoneNumber: "123-456-7890",
          role: "user"
        });
        
        console.log("Admin user created successfully.");
      }
      
      // Seed departments if none exist
      const existingDepartments = await this.getAllDepartments();
      if (existingDepartments.length === 0) {
        console.log("Seeding departments...");
        const departmentData = [
          { hospitalId: 1, name: "Cardiology", description: "Heart and cardiovascular care" },
          { hospitalId: 1, name: "Neurology", description: "Brain and nervous system care" },
          { hospitalId: 1, name: "Orthopedics", description: "Bone and joint care" },
          { hospitalId: 1, name: "Pediatrics", description: "Children's healthcare" },
          { hospitalId: 1, name: "General Medicine", description: "General health and wellness" }
        ];
        
        for (const dept of departmentData) {
          await db.insert(departments).values(dept);
        }
        console.log("Departments seeded successfully.");
      }
      
    } catch (error) {
      console.error("Error seeding initial data:", error);
    }
  }
}

export const storage = new DatabaseStorage();
