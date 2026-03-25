import { signIn, signUp, getCurrentUser } from './lib/supabase.js';

let isSignUpMode = false;

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const fullNameInput = document.getElementById('full-name');
const roleInput = document.getElementById('role');
const submitBtn = document.getElementById('submit-btn');
const alertMessage = document.getElementById('alert-message');
const toggleModeBtn = document.getElementById('toggle-mode');
const toggleText = document.getElementById('toggle-text');
const nameField = document.getElementById('name-field');
const roleField = document.getElementById('role-field');
const authTitle = document.getElementById('auth-mode-title');
const authSubtitle = document.getElementById('auth-mode-subtitle');

async function checkAuth() {
  try {
    const user = await getCurrentUser();
    if (user) {
      window.location.href = '/dashboard.html';
    }
  } catch (error) {
    console.log('Not authenticated');
  }
}

checkAuth();

toggleModeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;

  if (isSignUpMode) {
    authTitle.textContent = 'Create Account';
    authSubtitle.textContent = 'Sign up to get started';
    submitBtn.textContent = 'Sign Up';
    toggleText.textContent = 'Already have an account?';
    toggleModeBtn.textContent = 'Sign In';
    nameField.style.display = 'block';
    roleField.style.display = 'block';
    fullNameInput.required = true;
  } else {
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Sign in to access your dashboard';
    submitBtn.textContent = 'Sign In';
    toggleText.textContent = "Don't have an account?";
    toggleModeBtn.textContent = 'Sign Up';
    nameField.style.display = 'none';
    roleField.style.display = 'none';
    fullNameInput.required = false;
  }

  hideAlert();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    return;
  }

  submitBtn.classList.add('loading');
  submitBtn.textContent = isSignUpMode ? 'Creating account...' : 'Signing in...';
  hideAlert();

  try {
    if (isSignUpMode) {
      const fullName = fullNameInput.value.trim();
      const role = roleInput.value;

      if (!fullName) {
        showAlert('Please enter your full name', 'error');
        return;
      }

      await signUp(email, password, fullName, role);
      showAlert('Account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    } else {
      await signIn(email, password);
      showAlert('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    }
  } catch (error) {
    console.error('Auth error:', error);
    let errorMessage = error.message;

    if (errorMessage.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password';
    } else if (errorMessage.includes('User already registered')) {
      errorMessage = 'This email is already registered';
    } else if (errorMessage.includes('Email not confirmed')) {
      errorMessage = 'Please check your email to confirm your account';
    }

    showAlert(errorMessage, 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
  }
});

function showAlert(message, type) {
  alertMessage.textContent = message;
  alertMessage.className = `alert ${type} show`;
}

function hideAlert() {
  alertMessage.classList.remove('show');
}
