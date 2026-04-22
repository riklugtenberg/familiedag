import { notFound } from 'next/navigation';
import { opdrachten } from '@/config/opdrachten';
import OpdrachtPagina from '@/components/OpdrachtPagina';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const opdracht = opdrachten.find((o) => o.id === id);
  if (!opdracht) notFound();
  return <OpdrachtPagina opdracht={opdracht} />;
}

export function generateStaticParams() {
  return opdrachten.map((o) => ({ id: o.id }));
}
