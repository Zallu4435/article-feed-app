import * as yup from 'yup';

export const registerSchema = yup
  .object({
    firstName: yup
      .string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .matches(/^[a-zA-Z\s-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: yup
      .string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .matches(/^[a-zA-Z\s-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    email: yup
      .string()
      .required('Email is required')
      .email('Please enter a valid email address')
      .max(100, 'Email must not exceed 100 characters')
      .test('email-format', 'Please enter a valid email address', (value) => {
        if (!value) return false;

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(value);
      }),
    phone: yup
      .string()
      .required('Phone number is required')
      .test('phone-format', 'Please enter a valid phone number', (value) => {
        if (!value) return false;
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
      }),
    dateOfBirth: yup
      .string()
      .required('Date of birth is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .test('not-in-future', 'Date of birth cannot be in the future', (value) => {
        if (!value) return false;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d.getTime() <= today.getTime();
      })
      .test('reasonable-range', 'Date of birth must be after 1900-01-01', (value) => {
        if (!value) return false;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        const min = new Date('1900-01-01T00:00:00Z');
        return d.getTime() >= min.getTime();
      })
      .test('minimum-age', 'You must be at least 13 years old to register', (value) => {
        if (!value) return false;
        const birthDate = new Date(value);
        if (Number.isNaN(birthDate.getTime())) return false;
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          return age - 1 >= 13;
        }
        return age >= 13;
      }),
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .test('password-strength', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character', (value) => {
        if (!value) return false;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
        return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
      })
      .test('no-common-passwords', 'This password is too common. Please choose a more secure password', (value) => {
        if (!value) return false;
        const commonPasswords = [
          'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
          'password1', 'admin', 'letmein', 'welcome', '123123', 'password12'
        ];
        return !commonPasswords.includes(value.toLowerCase());
      }),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
  })
  .required();

export type RegisterFormData = yup.InferType<typeof registerSchema>;


