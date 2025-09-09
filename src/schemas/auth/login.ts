import * as yup from 'yup';

export const loginSchema = yup
  .object({
    emailOrPhone: yup.string().required('Email or phone is required'),
    password: yup.string().required('Password is required'),
  })
  .required();

export type LoginFormData = yup.InferType<typeof loginSchema>;


