/* ==========================================================================
   AUTHENTICATION MODULE (js/auth.js)
   Handles registration, sign in, validation, session persistence & demo user
   ========================================================================== */

const AuthModule = (() => {
    // Default Demo Accounts Pre-registered into LocalStorage
    const DEMO_ACCOUNTS = [
        {
            name: 'Alex Morgan',
            email: 'admin@nexus.io',
            password: 'password123',
            role: 'Administrator',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
        },
        {
            name: 'Sarah Jenkins',
            email: 'sarah@nexus.io',
            password: 'password123',
            role: 'Software Engineer',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
        }
    ];

    // LocalStorage Keys
    const USERS_STORAGE_KEY = 'nexus_users_db';
    const SESSION_STORAGE_KEY = 'nexus_current_session';

    // Initialize local database if empty
    const initDatabase = () => {
        if (!localStorage.getItem(USERS_STORAGE_KEY)) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEMO_ACCOUNTS));
        }
    };

    // Get all registered users
    const getUsers = () => {
        initDatabase();
        return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    };

    // Save user to storage
    const saveUser = (user) => {
        const users = getUsers();
        users.push(user);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    };

    // Get Current Active Session
    const getCurrentUser = () => {
        const session = localStorage.getItem(SESSION_STORAGE_KEY);
        return session ? JSON.parse(session) : null;
    };

    // Set Session
    const setSession = (user) => {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    };

    // Clear Session (Sign Out)
    const logout = () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    };

    // Password Strength Evaluator
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (!password) return { score: 0, text: '', class: '' };
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { score, text: 'Weak password', class: 'weak' };
        if (score === 2 || score === 3) return { score, text: 'Medium strength', class: 'medium' };
        return { score, text: 'Strong password', class: 'strong' };
    };

    // Email Validator
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Sign In Action
    const authenticate = (email, password) => {
        const users = getUsers();
        const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

        if (!found) {
            return { success: false, message: 'No account found with this email address.' };
        }

        if (found.password !== password) {
            return { success: false, message: 'Incorrect password. Please try again.' };
        }

        // Success - Set current session
        setSession(found);
        return { success: true, user: found };
    };

    // Sign Up Action
    const register = ({ name, email, password, role }) => {
        const users = getUsers();
        const exists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());

        if (exists) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        const newUser = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: role || 'Software Engineer',
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`
        };

        saveUser(newUser);
        setSession(newUser);
        return { success: true, user: newUser };
    };

    return {
        initDatabase,
        getUsers,
        getCurrentUser,
        setSession,
        logout,
        checkPasswordStrength,
        isValidEmail,
        authenticate,
        register,
        DEMO_ACCOUNTS
    };
})();
