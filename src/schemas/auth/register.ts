import * as yup from 'yup';

export const registerSchema = yup
  .object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
    dateOfBirth: yup
      .string()
      .required('Date of birth is required')
      .test('not-in-future', 'Date of birth cannot be in the future', (value) => {
        if (!value) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dob = new Date(value);
        return dob.getTime() <= today.getTime();
      }),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
  })
  .required();

export type RegisterFormData = yup.InferType<typeof registerSchema>;


