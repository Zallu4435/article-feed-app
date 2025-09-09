import * as yup from 'yup';

export const profileSchema = yup
  .object({
    firstName: yup.string().required('First name is required').max(100, 'First name is too long'),
    lastName: yup.string().required('Last name is required').max(100, 'Last name is too long'),
    phone: yup
      .string()
      .nullable()
      .transform((v) => (v === '' ? null : v))
      .matches(/^\+?[0-9\s-()]{7,20}$/,
        { message: 'Phone number is invalid', excludeEmptyString: true }),
    dateOfBirth: yup
      .string()
      .nullable()
      .transform((v) => (v === '' ? null : v))
      .matches(/^\d{4}-\d{2}-\d{2}$/,
        { message: 'Date must be in YYYY-MM-DD format', excludeEmptyString: true })
      .test('not-in-future', 'Date of birth cannot be in the future', (value) => {
        if (!value) return true;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        return d.getTime() <= today.getTime();
      })
      .test('reasonable-range', 'Date of birth must be after 1900-01-01', (value) => {
        if (!value) return true;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return false;
        const min = new Date('1900-01-01T00:00:00Z');
        return d.getTime() >= min.getTime();
      }),
  })
  .required();

export type ProfileFormData = yup.InferType<typeof profileSchema>;


