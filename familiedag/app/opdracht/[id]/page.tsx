import { notFound } from 'next/navigation';
import { opdrachten, type Opdracht } from '@/config/opdrachten';
import OpdrachtPagina from '@/components/OpdrachtPagina';

type Props = {
  params: Promise<{ id: string }>;
};

function stripGevoeligeData(opdracht: Opdracht): Opdracht {
  if (opdracht.type === 'muziek') {
    return {
      ...opdracht,
      fragmenten: opdracht.fragmenten.map(({ artiest: _a, titel: _t, ...rest }) => rest),
    };
  }
  if (opdracht.type === 'geluid') {
    return {
      ...opdracht,
      fragmenten: opdracht.fragmenten.map(({ antwoordJury: _j, ...rest }) => rest),
    } as Opdracht;
  }
  if (opdracht.type === 'quiz') {
    return {
      ...opdracht,
      vragen: opdracht.vragen.map((v) => {
        const { antwoordJury: _a, ...zonderJury } = v as typeof v & { antwoordJury?: string };
        return zonderJury;
      }),
    };
  }
  if (opdracht.type === 'kaart') {
    return {
      ...opdracht,
      vragen: opdracht.vragen.map(({ lat: _la, lng: _ln, referentie: _re, ...rest }) => rest),
    } as Opdracht;
  }
  return opdracht;
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
