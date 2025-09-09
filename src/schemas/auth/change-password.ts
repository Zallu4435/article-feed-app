import * as yup from 'yup';

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
};

export const changePasswordSchema = yup
  .object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup
      .string()
      .required('New password is required')
      .min(8, 'New password must be at least 8 characters')
      .test('different-from-current', 'New password must be different from current password', function (value) {
        const current = this.parent.currentPassword as string | undefined;
        if (!value || !current) return true;
        return value !== current;
      }),
  })
  .required();


