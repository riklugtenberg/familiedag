import { notFound } from 'next/navigation';
import { opdrachten, type Opdracht } from '@/config/opdrachten';
import OpdrachtPagina from '@/components/OpdrachtPagina';

type Props = {
  params: Promise<{ id: string }>;
};

function stripGevoeligeData(opdracht: Opdracht): Opdracht {
  if (opdracht.type !== 'muziek') return opdracht;
  return {
    ...opdracht,
    fragmenten: opdracht.fragmenten.map(({ artiest: _a, titel: _t, ...rest }) => rest),
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const opdracht = opdrachten.find((o) => o.id === id);
  if (!opdracht) notFound();
  return <OpdrachtPagina opdracht={stripGevoeligeData(opdracht)} />;
}

export function generateStaticParams() {
  return opdrachten.map((o) => ({ id: o.id }));
}
