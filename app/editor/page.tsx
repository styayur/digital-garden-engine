import type { Metadata } from 'next';
import { EditorClient } from '@/components/editor/EditorClient';

export const metadata: Metadata = {
  title: 'Visual editor',
  description: 'Edit a Rhizomaybor project visually, then export a portable website.',
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return <EditorClient />;
}
