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
  profileImage: text("profile_image"),
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
  hospital: text("hospital"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  profileImage: text("profile_image"),
  availableDays: text("available_days").array(),
  rating: integer("rating"),
});

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  logo: text("logo"),
  rating: integer("rating"),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  isVirtual: boolean("is_virtual").default(false),
  status: text("status").default("scheduled"),
  notes: text("notes"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Schema for user insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phoneNumber: true
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
});

// Schema for chat message insertion
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

// Types for the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type User = typeof users.$inferSelect;
export type HealthData = typeof healthData.$inferSelect;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type Hospital = typeof hospitals.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
