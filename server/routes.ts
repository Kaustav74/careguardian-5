import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertHealthDataSchema, 
  insertMedicalRecordSchema, 
  insertAppointmentSchema, 
  insertChatMessageSchema,
  insertMedicationSchema,
  insertMedicationLogSchema
} from "@shared/schema";
import { analyzeSymptoms, getFirstAidGuidance } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Health Data Routes
  app.get("/api/health-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const userData = await storage.getUserHealthData(req.user.id);
      res.json(userData);
    } catch (error) {
      console.error("Failed to get health data:", error);
      res.status(500).json({ message: "Failed to get health data" });
    }
  });
  
  app.get("/api/health-data/latest", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const latestData = await storage.getLatestHealthData(req.user.id);
      if (!latestData) {
        return res.status(404).json({ message: "No health data found" });
      }
      res.json(latestData);
    } catch (error) {
      console.error("Failed to get latest health data:", error);
      res.status(500).json({ message: "Failed to get latest health data" });
    }
  });
  
  app.post("/api/health-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertHealthDataSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newHealthData = await storage.createHealthData(validatedData);
      res.status(201).json(newHealthData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid health data", errors: error.errors });
      }
      
      console.error("Failed to create health data:", error);
      res.status(500).json({ message: "Failed to create health data" });
    }
  });
  
  // Medical Records Routes
  app.get("/api/medical-records", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const records = await storage.getUserMedicalRecords(req.user.id);
      res.json(records);
    } catch (error) {
      console.error("Failed to get medical records:", error);
      res.status(500).json({ message: "Failed to get medical records" });
    }
  });
  
  app.get("/api/medical-records/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const recordId = parseInt(req.params.id);
      if (isNaN(recordId)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }
      
      const record = await storage.getMedicalRecord(recordId);
      if (!record) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      
      if (record.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to medical record" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Failed to get medical record:", error);
      res.status(500).json({ message: "Failed to get medical record" });
    }
  });
  
  app.post("/api/medical-records", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertMedicalRecordSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newRecord = await storage.createMedicalRecord(validatedData);
      res.status(201).json(newRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medical record data", errors: error.errors });
      }
      
      console.error("Failed to create medical record:", error);
      res.status(500).json({ message: "Failed to create medical record" });
    }
  });
  
  // Doctors Routes
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      console.error("Failed to get doctors:", error);
      res.status(500).json({ message: "Failed to get doctors" });
    }
  });
  
  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
      
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      console.error("Failed to get doctor:", error);
      res.status(500).json({ message: "Failed to get doctor" });
    }
  });
  
  // Hospitals Routes
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      console.error("Failed to get hospitals:", error);
      res.status(500).json({ message: "Failed to get hospitals" });
    }
  });
  
  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }
      
      const hospital = await storage.getHospital(hospitalId);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      
      res.json(hospital);
    } catch (error) {
      console.error("Failed to get hospital:", error);
      res.status(500).json({ message: "Failed to get hospital" });
    }
  });
  
  // Appointments Routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const appointments = await storage.getUserAppointments(req.user.id);
      res.json(appointments);
    } catch (error) {
      console.error("Failed to get appointments:", error);
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });
  
  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newAppointment = await storage.createAppointment(validatedData);
      res.status(201).json(newAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      
      console.error("Failed to create appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });
  
  app.patch("/api/appointments/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      if (appointment.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to appointment" });
      }
      
      const updatedAppointment = await storage.updateAppointmentStatus(appointmentId, status);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });
  
  // Symptom Checker Routes
  app.post("/api/symptom-checker", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { symptoms, age, gender, medicalHistory } = req.body;
      
      if (!symptoms || typeof symptoms !== 'string') {
        return res.status(400).json({ message: "Symptoms description is required" });
      }
      
      if (!age || typeof age !== 'number') {
        return res.status(400).json({ message: "Age is required and must be a number" });
      }
      
      if (!gender || typeof gender !== 'string') {
        return res.status(400).json({ message: "Gender is required" });
      }
      
      const result = await analyzeSymptoms(symptoms, age, gender, medicalHistory);
      res.json(result);
    } catch (error) {
      console.error("Failed to analyze symptoms:", error);
      res.status(500).json({ 
        message: "Failed to analyze symptoms", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  app.post("/api/first-aid-guidance", async (req, res) => {
    try {
      const { situation } = req.body;
      
      if (!situation || typeof situation !== 'string') {
        return res.status(400).json({ message: "Situation description is required" });
      }
      
      const result = await getFirstAidGuidance(situation);
      res.json(result);
    } catch (error) {
      console.error("Failed to get first aid guidance:", error);
      res.status(500).json({ 
        message: "Failed to get first aid guidance", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Medications Routes
  app.get("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const medications = await storage.getUserMedications(req.user.id);
      res.json(medications);
    } catch (error) {
      console.error("Failed to get medications:", error);
      res.status(500).json({ message: "Failed to get medications" });
    }
  });
  
  app.get("/api/medications/active", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const activeMedications = await storage.getUserActiveMedications(req.user.id);
      res.json(activeMedications);
    } catch (error) {
      console.error("Failed to get active medications:", error);
      res.status(500).json({ message: "Failed to get active medications" });
    }
  });
  
  app.get("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const medicationId = parseInt(req.params.id);
      if (isNaN(medicationId)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const medication = await storage.getMedication(medicationId);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to medication" });
      }
      
      res.json(medication);
    } catch (error) {
      console.error("Failed to get medication:", error);
      res.status(500).json({ message: "Failed to get medication" });
    }
  });
  
  app.post("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertMedicationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newMedication = await storage.createMedication(validatedData);
      res.status(201).json(newMedication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medication data", errors: error.errors });
      }
      
      console.error("Failed to create medication:", error);
      res.status(500).json({ message: "Failed to create medication" });
    }
  });
  
  app.patch("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const medicationId = parseInt(req.params.id);
      if (isNaN(medicationId)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const medication = await storage.getMedication(medicationId);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to medication" });
      }
      
      // Remove id and userId from the update data for security
      const { id, userId, ...updateData } = req.body;
      
      const updatedMedication = await storage.updateMedication(medicationId, updateData);
      res.json(updatedMedication);
    } catch (error) {
      console.error("Failed to update medication:", error);
      res.status(500).json({ message: "Failed to update medication" });
    }
  });
  
  app.patch("/api/medications/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const medicationId = parseInt(req.params.id);
      if (isNaN(medicationId)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const { active } = req.body;
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: "Active status must be a boolean" });
      }
      
      const medication = await storage.getMedication(medicationId);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to medication" });
      }
      
      const updatedMedication = await storage.toggleMedicationStatus(medicationId, active);
      res.json(updatedMedication);
    } catch (error) {
      console.error("Failed to toggle medication status:", error);
      res.status(500).json({ message: "Failed to toggle medication status" });
    }
  });
  
  app.get("/api/medications/:id/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const medicationId = parseInt(req.params.id);
      if (isNaN(medicationId)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const medication = await storage.getMedication(medicationId);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to medication logs" });
      }
      
      const logs = await storage.getMedicationLogs(medicationId);
      res.json(logs);
    } catch (error) {
      console.error("Failed to get medication logs:", error);
      res.status(500).json({ message: "Failed to get medication logs" });
    }
  });
  
  app.post("/api/medications/:id/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const medicationId = parseInt(req.params.id);
      if (isNaN(medicationId)) {
        return res.status(400).json({ message: "Invalid medication ID" });
      }
      
      const medication = await storage.getMedication(medicationId);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to medication" });
      }
      
      const validatedData = insertMedicationLogSchema.parse({
        ...req.body,
        medicationId,
        userId: req.user.id
      });
      
      const newLog = await storage.createMedicationLog(validatedData);
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medication log data", errors: error.errors });
      }
      
      console.error("Failed to create medication log:", error);
      res.status(500).json({ message: "Failed to create medication log" });
    }
  });

  // Chat Routes
  app.get("/api/chat/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const chatHistory = await storage.getUserChatHistory(req.user.id);
      res.json(chatHistory);
    } catch (error) {
      console.error("Failed to get chat history:", error);
      res.status(500).json({ message: "Failed to get chat history" });
    }
  });
  
  app.post("/api/chat/message", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newMessage = await storage.createChatMessage(validatedData);
      
      // Use AI for first aid assistant
      if (validatedData.isUserMessage) {
        try {
          // Try to get an AI-powered response for first aid guidance
          const userMessage = validatedData.message;
          
          // Try to use OpenAI for more advanced responses
          const firstAidGuidance = await getFirstAidGuidance(userMessage);
          
          // Create a formatted response from the AI guidance
          let aiResponse = `${firstAidGuidance.situation}\n\n`;
          
          if (firstAidGuidance.steps && firstAidGuidance.steps.length > 0) {
            aiResponse += "**Steps:**\n";
            firstAidGuidance.steps.forEach((step, index) => {
              aiResponse += `${index + 1}. ${step}\n`;
            });
            aiResponse += "\n";
          }
          
          if (firstAidGuidance.warnings && firstAidGuidance.warnings.length > 0) {
            aiResponse += "**Important Warnings:**\n";
            firstAidGuidance.warnings.forEach((warning) => {
              aiResponse += `• ${warning}\n`;
            });
            aiResponse += "\n";
          }
          
          aiResponse += `_${firstAidGuidance.disclaimer}_`;
          
          const botResponseData = {
            userId: req.user.id,
            message: aiResponse,
            isUserMessage: false
          };
          
          const botResponse = await storage.createChatMessage(botResponseData);
          res.status(201).json({ userMessage: newMessage, botResponse });
        } catch (aiError) {
          // Fallback to the original response simulator if AI fails
          console.error("AI response failed, using fallback:", aiError);
          const botResponse = await simulateChatbotResponse(validatedData.message, req.user.id);
          res.status(201).json({ userMessage: newMessage, botResponse });
        }
      } else {
        res.status(201).json(newMessage);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      
      console.error("Failed to create chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simple chatbot response simulator
async function simulateChatbotResponse(userMessage: string, userId: number): Promise<any> {
  // Convert message to lowercase for easier matching
  const message = userMessage.toLowerCase();
  
  // Define some basic responses for common first aid queries
  let response = "I'm sorry, I don't understand that query. Could you please rephrase it or ask about a specific first aid situation?";
  
  if (message.includes("burn")) {
    response = "For a minor burn:\n1. Cool the burn with cool (not cold) running water for 10-15 minutes\n2. Remove rings or other tight items\n3. Apply lotion with aloe vera\n4. Bandage the burn loosely with a sterile gauze\n5. Take an over-the-counter pain reliever if needed\n\nIf the burn is severe or larger than 3 inches, seek medical attention immediately.";
  } else if (message.includes("cut") || message.includes("bleeding")) {
    response = "To control bleeding:\n1. Apply direct pressure with a clean cloth or bandage\n2. Keep the injured area elevated above the heart if possible\n3. Clean the wound with soap and water once bleeding slows\n4. Apply antibiotic ointment and cover with a sterile bandage\n\nSeek medical attention if bleeding doesn't stop after 15 minutes of pressure or the wound is deep/large.";
  } else if (message.includes("cpr") || message.includes("cardiac")) {
    response = "For CPR (adult):\n1. Call emergency services (911)\n2. Place the person on their back on a firm surface\n3. Place your hands, one on top of the other, on the center of the chest\n4. Push hard and fast, about 100-120 compressions per minute\n5. Let the chest rise completely between compressions\n\nConsider rescue breaths if trained, but compression-only CPR can be effective too.";
  } else if (message.includes("chok")) {
    response = "For a choking adult:\n1. Ask 'Are you choking?' If they nod yes and cannot speak, act immediately\n2. Stand behind the person and wrap your arms around their waist\n3. Make a fist with one hand and place it slightly above their navel\n4. Grasp your fist with your other hand and press inward and upward with quick thrusts\n5. Repeat until the object is expelled\n\nIf the person becomes unconscious, begin CPR.";
  } else if (message.includes("heart attack") || message.includes("chest pain")) {
    response = "Possible heart attack symptoms include chest pain/pressure, pain in arms/back/neck/jaw, shortness of breath, cold sweat, nausea.\n\nActions to take:\n1. Call emergency services (911) immediately\n2. Have the person sit down and rest\n3. Loosen tight clothing\n4. If the person takes heart medication like nitroglycerin, help them take it\n5. If advised by emergency services and the person is not allergic, they might chew an aspirin\n\nIf the person becomes unconscious, begin CPR if trained.";
  } else if (message.includes("stroke")) {
    response = "Remember the acronym FAST for stroke symptoms:\nF - Face drooping\nA - Arm weakness\nS - Speech difficulty\nT - Time to call emergency services\n\nAlso watch for sudden numbness, confusion, trouble seeing, dizziness, or severe headache.\n\nCall 911 immediately if you suspect a stroke. Note the time symptoms started.";
  } else if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    response = "Hello! I'm your virtual first aid assistant. How can I help you today?";
  } else if (message.includes("thank")) {
    response = "You're welcome! If you have any other first aid questions, feel free to ask.";
  }
  
  // Create and store the chatbot response
  const botResponseData = {
    userId: userId,
    message: response,
    isUserMessage: false
  };
  
  return storage.createChatMessage(botResponseData);
}
