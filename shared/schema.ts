import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  profileImage: text("profile_image"),
  role: text("role").notNull().default("user"), // user, hospital, ambulance
});

export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  heartRate: integer("heart_rate"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  bloodGlucose: integer("blood_glucose"),
  temperature: integer("temperature"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  doctorName: text("doctor_name"),
  hospital: text("hospital"),
  date: timestamp("date").notNull(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  department: text("department"), // Department like Cardiology, Neurology, etc.
  hospital: text("hospital"),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  phoneNumber: text("phone_number"),
  email: text("email"),
  profileImage: text("profile_image"),
  availableDays: text("available_days").array(),
  availabilityStatus: text("availability_status").default("available"), // available, unavailable, on-leave
  rating: integer("rating"),
});

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  logo: text("logo"),
  rating: integer("rating"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  departments: text("departments").array(),
  services: text("services").array(),
  emergencyServices: boolean("emergency_services").default(true),
  established: text("established"),
  beds: integer("beds"),
  website: text("website"),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  departmentId: integer("department_id").references(() => departments.id),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  isVirtual: boolean("is_virtual").default(false),
  status: text("status").default("scheduled"),
  notes: text("notes"),
  requestType: text("request_type").default("direct"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const doctorAvailability = pgTable("doctor_availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
});

export const doctorLeaves = pgTable("doctor_leaves", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
});

export const homeVisitRequests = pgTable("home_visit_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  symptoms: text("symptoms"),
  preferredDate: timestamp("preferred_date"),
  preferredTimeSlot: text("preferred_time_slot"),
  assignedHospitalId: integer("assigned_hospital_id").references(() => hospitals.id),
  assignedDoctorId: integer("assigned_doctor_id").references(() => doctors.id),
  status: text("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyIncidents = pgTable("emergency_incidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  address: text("address"),
  emergencyType: text("emergency_type"),
  description: text("description"),
  assignedAmbulanceId: integer("assigned_ambulance_id"),
  assignedHospitalId: integer("assigned_hospital_id").references(() => hospitals.id),
  status: text("status").default("pending"),
  dispatchedAt: timestamp("dispatched_at"),
  arrivedAt: timestamp("arrived_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ambulances = pgTable("ambulances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  vehicleNumber: text("vehicle_number").notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  currentLatitude: text("current_latitude"),
  currentLongitude: text("current_longitude"),
  status: text("status").default("available"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
});

export const ambulanceBookings = pgTable("ambulance_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ambulanceId: integer("ambulance_id").notNull().references(() => ambulances.id),
  pickupAddress: text("pickup_address").notNull(),
  pickupLatitude: text("pickup_latitude"),
  pickupLongitude: text("pickup_longitude"),
  dropoffAddress: text("dropoff_address"),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  medicalCondition: text("medical_condition"),
  status: text("status").default("pending"),
  scheduledTime: timestamp("scheduled_time"),
  dispatchedAt: timestamp("dispatched_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const symptomChecks = pgTable("symptom_checks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symptoms: text("symptoms").array().notNull(),
  diagnosis: text("diagnosis").notNull(),
  riskLevel: text("risk_level").notNull(), // low, moderate, high, critical
  recommendations: text("recommendations").notNull(),
  severity: text("severity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fitnessData = pgTable("fitness_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  source: text("source").notNull(), // manual, fitbit, apple-health, google-fit
  steps: integer("steps"),
  heartRate: integer("heart_rate"),
  caloriesBurned: integer("calories_burned"),
  sleepHours: integer("sleep_hours"),
  distance: integer("distance"), // in meters
  activeMinutes: integer("active_minutes"),
  weight: integer("weight"), // in kg
  date: timestamp("date").notNull(),
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Schema for user insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true
}).extend({
  role: z.enum(["user", "hospital", "ambulance"]).default("user")
});

// Schema for health data insertion
export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  recordedAt: true
});

// Schema for medical record insertion
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true
});

// Schema for appointment insertion
export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true
}).extend({
  date: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  })
});

// Schema for chat message insertion
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

// Types for the schemas
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  instructions: text("instructions"),
  timeOfDay: text("time_of_day").notNull(), // Morning, Afternoon, Evening, Night, or specific times
  withFood: boolean("with_food").default(false),
  active: boolean("active").default(true),
  refillDate: timestamp("refill_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationLogs = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
  skipped: boolean("skipped").default(false),
  notes: text("notes"),
});

export const insertMedicationSchema = createInsertSchema(medications, {
  id: undefined,
  createdAt: undefined,
});

export const insertMedicationLogSchema = createInsertSchema(medicationLogs, {
  id: undefined,
});

// Insert schema for hospitals
export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
});

// Insert schema for doctors
export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

// Insert schemas for new tables
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export const insertDoctorAvailabilitySchema = createInsertSchema(doctorAvailability).omit({
  id: true,
});

export const insertDoctorLeaveSchema = createInsertSchema(doctorLeaves).omit({
  id: true,
}).extend({
  startDate: z.union([z.string(), z.date()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
  endDate: z.union([z.string(), z.date()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export const insertHomeVisitRequestSchema = createInsertSchema(homeVisitRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  preferredDate: z.union([z.string(), z.date(), z.null()]).transform((val) => {
    if (!val) return null;
    return typeof val === 'string' ? new Date(val) : val;
  }).optional(),
});

export const insertEmergencyIncidentSchema = createInsertSchema(emergencyIncidents).omit({
  id: true,
  createdAt: true,
  dispatchedAt: true,
  arrivedAt: true,
  completedAt: true,
});

export const insertAmbulanceSchema = createInsertSchema(ambulances).omit({
  id: true,
});

export const insertAmbulanceBookingSchema = createInsertSchema(ambulanceBookings).omit({
  id: true,
  createdAt: true,
  dispatchedAt: true,
  completedAt: true,
});

export const insertSymptomCheckSchema = createInsertSchema(symptomChecks).omit({
  id: true,
  createdAt: true,
});

export const insertFitnessDataSchema = createInsertSchema(fitnessData).omit({
  id: true,
  syncedAt: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;
export type InsertDoctorLeave = z.infer<typeof insertDoctorLeaveSchema>;
export type InsertHomeVisitRequest = z.infer<typeof insertHomeVisitRequestSchema>;
export type InsertEmergencyIncident = z.infer<typeof insertEmergencyIncidentSchema>;
export type InsertAmbulance = z.infer<typeof insertAmbulanceSchema>;
export type InsertAmbulanceBooking = z.infer<typeof insertAmbulanceBookingSchema>;
export type InsertSymptomCheck = z.infer<typeof insertSymptomCheckSchema>;
export type InsertFitnessData = z.infer<typeof insertFitnessDataSchema>;

export const dietDays = pgTable("diet_days", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  totalCalories: integer("total_calories").default(0),
  totalProtein: integer("total_protein").default(0),
  totalCarbs: integer("total_carbs").default(0),
  totalFat: integer("total_fat").default(0),
  waterIntake: integer("water_intake").default(0),
  notes: text("notes"),
});

export const dietMeals = pgTable("diet_meals", {
  id: serial("id").primaryKey(),
  dietDayId: integer("diet_day_id").notNull().references(() => dietDays.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  time: text("time").notNull(),
  notes: text("notes"),
});

export const dietMealItems = pgTable("diet_meal_items", {
  id: serial("id").primaryKey(),
  dietMealId: integer("diet_meal_id").notNull().references(() => dietMeals.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
});

export const insertDietDaySchema = createInsertSchema(dietDays).omit({
  id: true,
});

export const insertDietMealSchema = createInsertSchema(dietMeals).omit({
  id: true,
});

export const insertDietMealItemSchema = createInsertSchema(dietMealItems).omit({
  id: true,
});

export type InsertDietDay = z.infer<typeof insertDietDaySchema>;
export type InsertDietMeal = z.infer<typeof insertDietMealSchema>;
export type InsertDietMealItem = z.infer<typeof insertDietMealItemSchema>;

export type DietDay = typeof dietDays.$inferSelect;
export type DietMeal = typeof dietMeals.$inferSelect;
export type DietMealItem = typeof dietMealItems.$inferSelect;

export type User = typeof users.$inferSelect;
export type HealthData = typeof healthData.$inferSelect;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type Hospital = typeof hospitals.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type DoctorAvailability = typeof doctorAvailability.$inferSelect;
export type DoctorLeave = typeof doctorLeaves.$inferSelect;
export type HomeVisitRequest = typeof homeVisitRequests.$inferSelect;
export type EmergencyIncident = typeof emergencyIncidents.$inferSelect;
export type Ambulance = typeof ambulances.$inferSelect;
export type AmbulanceBooking = typeof ambulanceBookings.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationLog = typeof medicationLogs.$inferSelect;
export type SymptomCheck = typeof symptomChecks.$inferSelect;
export type FitnessData = typeof fitnessData.$inferSelect;
