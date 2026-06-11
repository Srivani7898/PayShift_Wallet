import { mockDelay } from '../api.js';
import { storageService } from '../storage/storage';

const createUserFromIdentifier = (identifier = '') => {
  const trimmed = identifier.trim();
  const isEmail = /\S+@\S+\.\S+/.test(trimmed);
  const name = isEmail
    ? trimmed.split('@')[0].replace(/[._-]+/g, ' ')
    : trimmed || 'PayShift User';

  return {
    name: name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    phone: '+91 98765 43210',
    email: isEmail ? trimmed : `${name.toLowerCase().replace(/\s+/g, '.')}@payshift.test`,
    kyc: 'Pending',
  };
};

export const authService = {
  async login({ identifier }) {
    await mockDelay(true, 650);
    return { identifier, otpSent: true };
  },

  async verifyOtp({ otp, pendingIdentifier }) {
    await mockDelay(true, 800);
    console.log('Verifying OTP code:', otp);
    const token = 'demo-jwt-token-' + Math.random().toString(36).substring(2);
    
    // Check if the identifier matches a registered user (by email, name, or mobile)
    const registered = storageService.get('registered-users', []) || [];
    const matchedUser = registered.find(
      u => u.email?.toLowerCase() === pendingIdentifier.toLowerCase() ||
           u.mobile === pendingIdentifier ||
           u.name?.toLowerCase() === pendingIdentifier.toLowerCase()
    );
    
    const user = matchedUser || createUserFromIdentifier(pendingIdentifier);
    
    storageService.setToken(token);
    storageService.setUser(user);
    
    return { token, user };
  },

  async signup(profile) {
    await mockDelay(true, 900);
    const registered = storageService.get('registered-users', []) || [];
    
    if (registered.some(u => u.email?.toLowerCase() === profile.email?.toLowerCase() || u.mobile === profile.mobile)) {
      throw new Error('User with this email or mobile number already exists.');
    }
    
    const user = {
      ...createUserFromIdentifier(profile.email || profile.name),
      ...profile,
      kyc: 'Pending',
    };
    
    registered.push(user);
    storageService.set('registered-users', registered);
    
    return { user };
  },

  async logout() {
    await mockDelay(true, 300);
    storageService.removeToken();
    storageService.remove('user');
    window.dispatchEvent(new Event('payswift:logout'));
  },

  getCurrentUser() {
    return storageService.getUser();
  },

  isAuthenticated() {
    return !!storageService.getToken();
  }
};
export default authService;
