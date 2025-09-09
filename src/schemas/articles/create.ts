import * as yup from 'yup';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export const createArticleSchema = yup.object({
  title: yup.string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters')
    .required('Title is required'),
  description: yup.string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(300, 'Description cannot exceed 300 characters')
    .required('Description is required'),
  content: yup.string()
    .trim()
    .min(50, 'Content must be at least 50 characters')
    .required('Content is required'),
  categoryId: yup.string()
    .matches(uuidRegex, 'Please select a valid category')
    .required('Category is required'),
  tags: yup.string()
    .nullable()
    .transform(v => (typeof v === 'string' ? v.trim() : v))
    .test('tags-format', 'Tags must be comma-separated words', (value) => {
      if (!value) return true;
      return value.split(',').map(t => t.trim()).every(t => t.length > 0 && t.length <= 24);
    }),
  imageUrl: yup.string()
    .nullable()
    .test('is-image', 'Image must be a PNG or JPG', (value) => {
      if (!value) return true; // optional
      return /(\.png|\.jpg|\.jpeg)$/i.test(value);
    })
}).required();

export type CreateArticleForm = yup.InferType<typeof createArticleSchema>;


