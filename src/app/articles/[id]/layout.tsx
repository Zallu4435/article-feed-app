import type { Metadata, ResolvingMetadata } from 'next';
import { apiFetch } from '@/lib/api';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await apiFetch(`/api/articles/${id}`, { method: 'GET' });
    const article: any = (res as any)?.article || null;

    if (!article) return {};

    const title = article.title || 'Article';
    const description = article.description || '';
    const imageUrl = article.imageUrl || '/og-default.png';
    const url = `/articles/${id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        url,
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default async function ArticleLayout({ children }: Props) {
  return children;
}


