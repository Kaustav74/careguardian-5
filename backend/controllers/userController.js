// User controller for CareGuardian
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

class UserController {
  // Register a new user
  async registerUser(req, res) {
    try {
      const { username, email, password, fullName, role } = req.body;
      
      // Check if username or email already exists
      const existingUser = await User.findByUsernameOrEmail(username) || 
                           await User.findByUsernameOrEmail(email);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === username 
            ? 'Username already taken' 
            : 'Email already registered' 
        });
      }
      
      // Create the user
      const user = await User.create({
        username,
        email,
        password,
        fullName,
        role: role || 'patient'
      });
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return user data and token
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token
      });
    } catch (error) {
      console.error('Register user error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
  
  // Login user
  async loginUser(req, res) {
    try {
      const { username, password } = req.body;
      
      // Find user by username or email
      const user = await User.findByUsernameOrEmail(username);
      
      // Check if user exists and password matches
      if (user && await User.validatePassword(password, user.password)) {
        // Generate token
        const token = generateToken(user.id);
        
        // Return user data and token
        res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          token
        });
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
  
  // Get user profile
  async getUserProfile(req, res) {
    try {
      // User is already attached to req by the protect middleware
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(req.user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error retrieving profile' });
    }
  }
  
  // Update user profile
  async updateUserProfile(req, res) {
    try {
      // User is already attached to req by the protect middleware
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user data
      const updatedUser = await User.update(req.user.id, req.body);
      
      // Generate a fresh token with updated data
      const token = generateToken(updatedUser.id);
      
      // Return updated user data and token
      res.status(200).json({
        ...updatedUser,
        token
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error updating profile' });
    }
  }
  
  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // User is already attached to req by the protect middleware
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get the full user data including password hash
      const user = await User.findByUsernameOrEmail(req.user.username);
      
      // Verify current password
      const isMatch = await User.validatePassword(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Change the password
      await User.changePassword(req.user.id, newPassword);
      
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error changing password' });
    }
  }
}

export default new UserController();