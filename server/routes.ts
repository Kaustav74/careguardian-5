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
  insertMedicationLogSchema,
  insertDietDaySchema,
  insertDietMealSchema,
  insertDietMealItemSchema,
  insertHomeVisitRequestSchema,
  insertEmergencyIncidentSchema,
  insertAmbulanceBookingSchema,
  insertHospitalSchema,
  insertDoctorSchema,
  insertSymptomCheckSchema,
  insertFitnessDataSchema
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

  // Get doctors by department
  app.get("/api/doctors/department/:department", async (req, res) => {
    try {
      const department = req.params.department;
      const doctors = await storage.getDoctorsByDepartment(department);
      res.json(doctors);
    } catch (error) {
      console.error("Failed to get doctors by department:", error);
      res.status(500).json({ message: "Failed to get doctors by department" });
    }
  });

  // Update doctor (availability status, etc.)
  app.patch("/api/doctors/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const doctorId = parseInt(req.params.id);
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }

      // Only allow hospitals to update doctors
      if (req.user.role !== "hospital") {
        return res.status(403).json({ message: "Only hospitals can update doctor information" });
      }

      const updatedDoctor = await storage.updateDoctor(doctorId, req.body);
      if (!updatedDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json(updatedDoctor);
    } catch (error) {
      console.error("Failed to update doctor:", error);
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  // Update doctor availability status
  app.patch("/api/doctors/:id/availability", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const doctorId = parseInt(req.params.id);
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }

      // Only allow hospitals to update doctor availability
      if (req.user.role !== "hospital") {
        return res.status(403).json({ message: "Only hospitals can update doctor availability" });
      }

      const { status } = req.body;
      if (!status || !["available", "unavailable", "on-leave"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be available, unavailable, or on-leave" });
      }

      const updatedDoctor = await storage.updateDoctorAvailabilityStatus(doctorId, status);
      if (!updatedDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json(updatedDoctor);
    } catch (error) {
      console.error("Failed to update doctor availability:", error);
      res.status(500).json({ message: "Failed to update doctor availability" });
    }
  });
  
  // Hospitals Routes
  app.get("/api/hospitals", async (req, res) => {
    try {
      let hospitals;
      
      // If user is authenticated and has a city set, filter by their city
      if (req.isAuthenticated() && req.user.city) {
        hospitals = await storage.searchHospitalsByCity(req.user.city);
      } else {
        // Otherwise return all hospitals
        hospitals = await storage.getAllHospitals();
      }
      
      res.json(hospitals);
    } catch (error) {
      console.error("Failed to get hospitals:", error);
      res.status(500).json({ message: "Failed to get hospitals" });
    }
  });
  
  // Get current hospital details (for logged-in hospital user)
  // IMPORTANT: This MUST come before /api/hospitals/:id to match correctly
  app.get("/api/hospitals/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      if (req.user.role !== "hospital") {
        return res.status(403).json({ message: "Only hospitals can access this endpoint" });
      }

      const hospital = await storage.getHospitalByUserId(req.user.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found. Please contact support." });
      }

      res.json(hospital);
    } catch (error) {
      console.error("Failed to get hospital:", error);
      res.status(500).json({ message: "Failed to get hospital" });
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

  app.post("/api/hospitals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertHospitalSchema.parse(req.body);
      const newHospital = await storage.createHospital(validatedData);
      res.status(201).json(newHospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hospital data", errors: error.errors });
      }
      console.error("Failed to create hospital:", error);
      res.status(500).json({ message: "Failed to create hospital" });
    }
  });

  app.patch("/api/hospitals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }
      
      const updatedHospital = await storage.updateHospital(hospitalId, req.body);
      if (!updatedHospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      
      res.json(updatedHospital);
    } catch (error) {
      console.error("Failed to update hospital:", error);
      res.status(500).json({ message: "Failed to update hospital" });
    }
  });

  // Get all doctors for a specific hospital
  app.get("/api/hospitals/:id/doctors", async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      const doctors = await storage.getDoctorsByHospital(hospitalId);
      res.json(doctors);
    } catch (error) {
      console.error("Failed to get hospital doctors:", error);
      res.status(500).json({ message: "Failed to get hospital doctors" });
    }
  });

  // Create/assign a doctor to a hospital
  app.post("/api/hospitals/:id/doctors", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const hospitalId = parseInt(req.params.id);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }

      // Only allow hospitals to create doctors
      if (req.user.role !== "hospital") {
        return res.status(403).json({ message: "Only hospitals can assign doctors" });
      }

      // Verify the hospital exists and user has access
      const hospital = await storage.getHospital(hospitalId);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      // Parse and validate doctor data
      const doctorData = insertDoctorSchema.parse({
        ...req.body,
        hospitalId,
        availabilityStatus: req.body.availabilityStatus || "available"
      });

      const newDoctor = await storage.createDoctor(doctorData);
      res.status(201).json(newDoctor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid doctor data", errors: error.errors });
      }
      console.error("Failed to create doctor:", error);
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.post("/api/hospitals/search", async (req, res) => {
    try {
      const { city, latitude, longitude, maxDistance = 50 } = req.body;
      
      // If city is provided, search by city
      if (city) {
        const hospitals = await storage.searchHospitalsByCity(city);
        return res.json({ hospitals });
      }
      
      // If location is provided, search by distance
      if (latitude !== undefined && longitude !== undefined) {
        const hospitals = await storage.searchHospitalsByLocation(
          parseFloat(latitude),
          parseFloat(longitude),
          maxDistance
        );
        return res.json({ hospitals });
      }
      
      // If neither, return all hospitals
      const hospitals = await storage.getAllHospitals();
      res.json({ hospitals });
    } catch (error) {
      console.error("Failed to search hospitals:", error);
      res.status(500).json({ message: "Failed to search hospitals" });
    }
  });

  app.patch("/api/user/location", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { city, state, latitude, longitude } = req.body;
      
      if (!city || !state || !latitude || !longitude) {
        return res.status(400).json({ message: "City, state, latitude, and longitude are required" });
      }
      
      const updatedUser = await storage.updateUserLocation(
        req.user.id,
        city,
        state,
        latitude,
        longitude
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to update user location:", error);
      res.status(500).json({ message: "Failed to update user location" });
    }
  });
  
  // Appointments Routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const appointments = await storage.getUserAppointmentsWithDetails(req.user.id);
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
  
  app.post("/api/appointments/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const success = await storage.cancelAppointment(appointmentId, req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found or unauthorized" });
      }
      
      res.json({ message: "Appointment cancelled successfully" });
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });
  
  app.post("/api/appointments/:id/reschedule", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      const { date, time } = req.body;
      if (!date || !time) {
        return res.status(400).json({ message: "Date and time are required" });
      }
      
      const newDate = new Date(date);
      const updatedAppointment = await storage.rescheduleAppointment(appointmentId, req.user.id, newDate, time);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found or unauthorized" });
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Failed to reschedule appointment:", error);
      res.status(500).json({ message: "Failed to reschedule appointment" });
    }
  });
  
  // Department Routes
  app.get("/api/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Failed to get departments:", error);
      res.status(500).json({ message: "Failed to get departments" });
    }
  });
  
  app.get("/api/hospitals/:hospitalId/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      if (isNaN(hospitalId)) {
        return res.status(400).json({ message: "Invalid hospital ID" });
      }
      
      const departments = await storage.getDepartmentsByHospital(hospitalId);
      res.json(departments);
    } catch (error) {
      console.error("Failed to get departments:", error);
      res.status(500).json({ message: "Failed to get departments" });
    }
  });
  
  // Home Visit Request Routes
  app.post("/api/home-visits", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertHomeVisitRequestSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newRequest = await storage.createHomeVisitRequest(validatedData);
      res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid home visit request data", errors: error.errors });
      }
      
      console.error("Failed to create home visit request:", error);
      res.status(500).json({ message: "Failed to create home visit request" });
    }
  });
  
  app.get("/api/home-visits", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const requests = await storage.getUserHomeVisitRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Failed to get home visit requests:", error);
      res.status(500).json({ message: "Failed to get home visit requests" });
    }
  });
  
  // Emergency Incident Routes
  app.post("/api/emergency", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertEmergencyIncidentSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const incident = await storage.createEmergencyIncident(validatedData);
      
      if (incident.latitude && incident.longitude) {
        const nearestAmbulance = await storage.getNearestAvailableAmbulance(
          incident.latitude,
          incident.longitude
        );
        
        if (nearestAmbulance) {
          await storage.updateAmbulanceStatus(nearestAmbulance.id, 'dispatched');
          await storage.updateEmergencyIncidentStatus(
            incident.id,
            'dispatched',
            nearestAmbulance.id
          );
          
          const updatedIncident = await storage.getEmergencyIncident(incident.id);
          return res.status(201).json({ 
            incident: updatedIncident, 
            ambulance: nearestAmbulance 
          });
        }
      }
      
      res.status(201).json({ incident, ambulance: null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid emergency data", errors: error.errors });
      }
      
      console.error("Failed to create emergency incident:", error);
      res.status(500).json({ message: "Failed to create emergency incident" });
    }
  });
  
  app.get("/api/emergency", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const incidents = await storage.getUserEmergencyIncidents(req.user.id);
      res.json(incidents);
    } catch (error) {
      console.error("Failed to get emergency incidents:", error);
      res.status(500).json({ message: "Failed to get emergency incidents" });
    }
  });
  
  app.get("/api/emergency/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const incidentId = parseInt(req.params.id);
      if (isNaN(incidentId)) {
        return res.status(400).json({ message: "Invalid incident ID" });
      }
      
      const incident = await storage.getEmergencyIncident(incidentId);
      if (!incident) {
        return res.status(404).json({ message: "Emergency incident not found" });
      }
      
      if (incident.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to emergency incident" });
      }
      
      res.json(incident);
    } catch (error) {
      console.error("Failed to get emergency incident:", error);
      res.status(500).json({ message: "Failed to get emergency incident" });
    }
  });
  
  // Ambulance Routes
  app.get("/api/ambulances/available", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const ambulances = await storage.getAvailableAmbulances();
      res.json(ambulances);
    } catch (error) {
      console.error("Failed to get available ambulances:", error);
      res.status(500).json({ message: "Failed to get available ambulances" });
    }
  });
  
  app.post("/api/ambulances/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { latitude, longitude, mode } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ message: "Invalid latitude or longitude" });
      }
      
      let maxDistance = mode === "emergency" ? 25 : 10;
      
      const ambulances = await storage.searchAmbulances(lat, lon, maxDistance);
      
      if (mode === "emergency" && ambulances.length === 0) {
        return res.json({ fallback: "call112", ambulances: [] });
      }
      
      res.json({ ambulances });
    } catch (error) {
      console.error("Failed to search ambulances:", error);
      res.status(500).json({ message: "Failed to search ambulances" });
    }
  });
  
  // Ambulance Booking Routes
  app.post("/api/ambulance-bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertAmbulanceBookingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const booking = await storage.createAmbulanceBooking(validatedData);
      console.log(`${new Date().toISOString()} [express] Ambulance booking created:`, booking);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      
      console.error("Failed to create ambulance booking:", error);
      res.status(500).json({ message: "Failed to create ambulance booking" });
    }
  });
  
  app.get("/api/ambulance-bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const bookings = await storage.getUserAmbulanceBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error("Failed to get ambulance bookings:", error);
      res.status(500).json({ message: "Failed to get ambulance bookings" });
    }
  });
  
  // Ambulance Driver Routes
  app.get("/api/ambulance/my-ambulance", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.role !== "ambulance") {
      return res.status(403).json({ message: "Access denied. Ambulance drivers only." });
    }
    
    try {
      const ambulance = await storage.getAmbulanceByUserId(req.user.id);
      res.json(ambulance || null);
    } catch (error) {
      console.error("Failed to get ambulance:", error);
      res.status(500).json({ message: "Failed to get ambulance" });
    }
  });
  
  app.get("/api/ambulance/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.role !== "ambulance") {
      return res.status(403).json({ message: "Access denied. Ambulance drivers only." });
    }
    
    try {
      const ambulance = await storage.getAmbulanceByUserId(req.user.id);
      if (!ambulance) {
        return res.json([]);
      }
      
      const bookings = await storage.getAmbulanceBookingsByAmbulanceId(ambulance.id);
      res.json(bookings);
    } catch (error) {
      console.error("Failed to get ambulance bookings:", error);
      res.status(500).json({ message: "Failed to get ambulance bookings" });
    }
  });
  
  app.patch("/api/ambulance/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.role !== "ambulance") {
      return res.status(403).json({ message: "Access denied. Ambulance drivers only." });
    }
    
    try {
      const { status } = req.body;
      const ambulance = await storage.getAmbulanceByUserId(req.user.id);
      
      if (!ambulance) {
        return res.status(404).json({ message: "Ambulance not found" });
      }
      
      const updated = await storage.updateAmbulanceStatus(ambulance.id, status);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update ambulance status:", error);
      res.status(500).json({ message: "Failed to update ambulance status" });
    }
  });
  
  app.patch("/api/ambulance/location", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.role !== "ambulance") {
      return res.status(403).json({ message: "Access denied. Ambulance drivers only." });
    }
    
    try {
      const { latitude, longitude } = req.body;
      const ambulance = await storage.getAmbulanceByUserId(req.user.id);
      
      if (!ambulance) {
        return res.status(404).json({ message: "Ambulance not found" });
      }
      
      const updated = await storage.updateAmbulanceLocation(ambulance.id, latitude, longitude);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update ambulance location:", error);
      res.status(500).json({ message: "Failed to update ambulance location" });
    }
  });
  
  app.patch("/api/ambulance/bookings/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.role !== "ambulance") {
      return res.status(403).json({ message: "Access denied. Ambulance drivers only." });
    }
    
    try {
      const bookingId = parseInt(req.params.id);
      const updated = await storage.updateAmbulanceBookingStatus(bookingId, "accepted");
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to accept booking:", error);
      res.status(500).json({ message: "Failed to accept booking" });
    }
  });
  
  app.patch("/api/ambulance/bookings/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    if (req.user.role !== "ambulance") {
      return res.status(403).json({ message: "Access denied. Ambulance drivers only." });
    }
    
    try {
      const bookingId = parseInt(req.params.id);
      const updated = await storage.updateAmbulanceBookingStatus(bookingId, "completed");
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to complete booking:", error);
      res.status(500).json({ message: "Failed to complete booking" });
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

  // Diet Routes
  app.get("/api/diet/:date", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const date = req.params.date;
      const dietDay = await storage.getUserDietDay(req.user.id, date);
      
      if (!dietDay) {
        return res.json(null);
      }
      
      const meals = await storage.getDietMeals(dietDay.id);
      const mealsWithItems = await Promise.all(
        meals.map(async (meal) => {
          const items = await storage.getDietMealItems(meal.id);
          return { ...meal, items };
        })
      );
      
      res.json({ ...dietDay, meals: mealsWithItems });
    } catch (error) {
      console.error("Failed to get diet:", error);
      res.status(500).json({ message: "Failed to get diet" });
    }
  });
  
  app.post("/api/diet", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertDietDaySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newDietDay = await storage.createDietDay(validatedData);
      res.status(201).json(newDietDay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid diet data", errors: error.errors });
      }
      
      console.error("Failed to create diet:", error);
      res.status(500).json({ message: "Failed to create diet" });
    }
  });
  
  app.put("/api/diet/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const dietDayId = parseInt(req.params.id);
      if (isNaN(dietDayId)) {
        return res.status(400).json({ message: "Invalid diet day ID" });
      }
      
      const updatedDietDay = await storage.updateDietDay(dietDayId, req.body);
      if (!updatedDietDay) {
        return res.status(404).json({ message: "Diet day not found" });
      }
      
      res.json(updatedDietDay);
    } catch (error) {
      console.error("Failed to update diet day:", error);
      res.status(500).json({ message: "Failed to update diet day" });
    }
  });
  
  app.post("/api/diet/meals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertDietMealSchema.parse(req.body);
      const newMeal = await storage.createDietMeal(validatedData);
      res.status(201).json(newMeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal data", errors: error.errors });
      }
      
      console.error("Failed to create meal:", error);
      res.status(500).json({ message: "Failed to create meal" });
    }
  });
  
  app.put("/api/diet/meals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const mealId = parseInt(req.params.id);
      if (isNaN(mealId)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }
      
      const updatedMeal = await storage.updateDietMeal(mealId, req.body);
      if (!updatedMeal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(updatedMeal);
    } catch (error) {
      console.error("Failed to update meal:", error);
      res.status(500).json({ message: "Failed to update meal" });
    }
  });
  
  app.delete("/api/diet/meals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const mealId = parseInt(req.params.id);
      if (isNaN(mealId)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }
      
      await storage.deleteDietMeal(mealId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete meal:", error);
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });
  
  app.post("/api/diet/meals/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertDietMealItemSchema.parse(req.body);
      const newItem = await storage.createDietMealItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meal item data", errors: error.errors });
      }
      
      console.error("Failed to create meal item:", error);
      res.status(500).json({ message: "Failed to create meal item" });
    }
  });
  
  app.delete("/api/diet/meals/items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid meal item ID" });
      }
      
      await storage.deleteDietMealItem(itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete meal item:", error);
      res.status(500).json({ message: "Failed to delete meal item" });
    }
  });
  
  // Symptom Checker Routes
  app.post("/api/symptom-check", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { symptoms, age, gender, medicalHistory } = req.body;
      
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({ message: "Symptoms array is required" });
      }
      
      if (!age || !gender) {
        return res.status(400).json({ message: "Age and gender are required" });
      }
      
      const symptomsText = symptoms.join(", ");
      const analysis = await analyzeSymptoms(symptomsText, age, gender, medicalHistory);
      
      const diagnosisText = analysis.possibleConditions
        .map(c => `${c.condition} (${c.probability} probability)`)
        .join("; ");
      
      const recommendationsText = analysis.recommendations.join("; ");
      
      const symptomCheckData = {
        userId: req.user.id,
        symptoms,
        diagnosis: diagnosisText,
        riskLevel: analysis.urgencyLevel,
        recommendations: recommendationsText,
        severity: analysis.urgencyLevel
      };
      
      const validatedData = insertSymptomCheckSchema.parse(symptomCheckData);
      const newCheck = await storage.createSymptomCheck(validatedData);
      
      res.status(201).json({
        ...newCheck,
        possibleConditions: analysis.possibleConditions,
        recommendationsArray: analysis.recommendations,
        disclaimer: analysis.disclaimer
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid symptom check data", errors: error.errors });
      }
      
      console.error("Failed to create symptom check:", error);
      res.status(500).json({ message: "Failed to analyze symptoms" });
    }
  });
  
  app.get("/api/symptom-checks", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const checks = await storage.getUserSymptomChecks(req.user.id);
      res.json(checks);
    } catch (error) {
      console.error("Failed to get symptom checks:", error);
      res.status(500).json({ message: "Failed to get symptom checks" });
    }
  });
  
  app.get("/api/symptom-checks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const checkId = parseInt(req.params.id);
      if (isNaN(checkId)) {
        return res.status(400).json({ message: "Invalid symptom check ID" });
      }
      
      const check = await storage.getSymptomCheck(checkId);
      if (!check) {
        return res.status(404).json({ message: "Symptom check not found" });
      }
      
      res.json(check);
    } catch (error) {
      console.error("Failed to get symptom check:", error);
      res.status(500).json({ message: "Failed to get symptom check" });
    }
  });
  
  // Fitness Data Routes
  app.post("/api/fitness-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const validatedData = insertFitnessDataSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newData = await storage.createFitnessData(validatedData);
      res.status(201).json(newData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid fitness data", errors: error.errors });
      }
      
      console.error("Failed to create fitness data:", error);
      res.status(500).json({ message: "Failed to create fitness data" });
    }
  });
  
  app.get("/api/fitness-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const data = await storage.getUserFitnessData(req.user.id);
      res.json(data);
    } catch (error) {
      console.error("Failed to get fitness data:", error);
      res.status(500).json({ message: "Failed to get fitness data" });
    }
  });
  
  app.get("/api/fitness-data/latest", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const latestData = await storage.getLatestFitnessData(req.user.id);
      if (!latestData) {
        return res.status(404).json({ message: "No fitness data found" });
      }
      res.json(latestData);
    } catch (error) {
      console.error("Failed to get latest fitness data:", error);
      res.status(500).json({ message: "Failed to get latest fitness data" });
    }
  });
  
  app.get("/api/fitness-data/range", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const data = await storage.getUserFitnessDataByDateRange(req.user.id, start, end);
      res.json(data);
    } catch (error) {
      console.error("Failed to get fitness data by range:", error);
      res.status(500).json({ message: "Failed to get fitness data by range" });
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
