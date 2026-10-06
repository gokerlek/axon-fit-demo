'use client';

import Image from 'next/image';
import { Plus } from '@phosphor-icons/react';
import { ExerciseList } from '@/app/dashboard/exercises/exercise-list';
import { TrainingTabs } from '@/app/dashboard/training-tabs';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceKindIcon } from '@/components/device-kind-icon';
import { ImagePlaceholder } from '@/components/image-placeholder';
import { TemplateMuscleMap } from '@/components/muscle-map/template-muscle-map';
import { deviceImageUrl } from '@/lib/device-media';
import { DEVICE_KIND_LABELS, describeDeviceLoads } from '@/lib/device-loads';
import { BODY_MUSCLES, exerciseSetWeights, summarizeMuscles } from '@/lib/muscles';
import { templateMuscleLoad, templateSummary } from '@/lib/template-plan';
import type { Exercise } from '@/lib/schemas/exercise';
import type { Device } from '@/lib/schemas/device';
import type { Template } from '@/lib/schemas/template';
import type { Attachment } from '@/lib/schemas/attachment';

export type LibrarySection = 'templates' | 'exercises' | 'devices' | 'attachments';
export type LibraryData = {
  exercises: (Exercise & { source: 'library' | 'custom' })[];
  devices: (Device & { source: 'library' | 'custom' })[];
  templates: Template[];
  attachments: Attachment[];
};

const path = (section: LibrarySection) => `/dashboard/${section}`;

export function DemoLibrary({ section, data, onSection, onEdit }: {
  section: LibrarySection;
  data: LibraryData;
  onSection: (section: LibrarySection) => void;
  onEdit: (section: LibrarySection, id: string | null) => void;
}) {
  const current = path(section);
  const handleLink = (event: React.MouseEvent<HTMLDivElement>) => {
    const href = (event.target as HTMLElement).closest('a')?.getAttribute('href');
    if (!href?.startsWith(current)) return;
    event.preventDefault();
    const suffix = href.slice(current.length).split('?')[0] ?? '';
    if (suffix === '/new') onEdit(section, null);
    else if (suffix.startsWith('/')) onEdit(section, suffix.slice(1).split('/')[0] ?? null);
  };
  const navigate = (href: string) => onSection(href.split('/')[2] as LibrarySection);
  const deviceNames = Object.fromEntries(data.devices.map(item => [item.id, item.name]));
  return <div onClickCapture={handleLink} className="flex flex-col gap-6">
    {section === 'exercises' ? <ExerciseList initial={data.exercises} deviceNames={deviceNames} demo={{ section: current, navigate }} /> : <>
      <TrainingTabs demo={{ active: current, navigate }} />
      <PageHeader title={{ templates: 'Şablonlar', devices: 'Cihazlar', attachments: 'Aparatlar' }[section]} description={`${data[section].length} kayıt`} actions={<Button onClick={() => onEdit(section, null)}><Plus data-icon="inline-start" />Yeni {section === 'templates' ? 'şablon' : section === 'devices' ? 'cihaz' : 'aparat'}</Button>} />
      {section === 'templates' ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.templates.map(template => {
        const byId = new Map(data.exercises.map(exercise => [exercise.id, exercise]));
        const { load } = templateMuscleLoad(template, byId, exerciseSetWeights);
        const summary = templateSummary(template, byId);
        const top = BODY_MUSCLES.filter(muscle => (load[muscle] ?? 0) > 0).sort((a, b) => (load[b] ?? 0) - (load[a] ?? 0)).slice(0, 3);
        return <li key={template.id}><button type="button" onClick={() => onEdit(section, template.id)} className="block h-full w-full text-left"><Card size="sm" className="h-full transition-colors hover:bg-muted/40"><div className="mx-(--card-spacing) rounded-lg bg-muted/40 py-3"><TemplateMuscleMap variant="compact" bodyClassName="h-80" load={load} /></div><CardHeader><CardTitle>{template.name}</CardTitle><CardDescription>{template.description || summarizeMuscles(top).join(', ') || 'Sayılan kas yükü yok'}</CardDescription></CardHeader><CardContent className="text-xs text-muted-foreground">{summary.rows} hareket · {summary.workingSets} set · ≈ {summary.minutes} dk</CardContent></Card></button></li>;
      })}</ul> : null}
      {section === 'devices' ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.devices.map(device => <li key={device.id}><button type="button" onClick={() => onEdit(section, device.id)} className="block h-full w-full text-left"><Card size="sm" className="h-full transition-colors hover:bg-muted/40"><CardHeader>{deviceImageUrl(device) ? <Image src={deviceImageUrl(device) ?? ''} alt="" width={400} height={112} unoptimized className="mb-2 h-28 w-full rounded-lg border bg-muted object-cover" /> : <ImagePlaceholder className="mb-2 h-28 w-full"><DeviceKindIcon kind={device.kind} className="size-8" /></ImagePlaceholder>}<CardTitle>{device.name}</CardTitle><CardDescription>{DEVICE_KIND_LABELS[device.kind]} · {describeDeviceLoads(device)}</CardDescription></CardHeader></Card></button></li>)}</ul> : null}
      {section === 'attachments' ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.attachments.map(attachment => <li key={attachment.id}><button type="button" onClick={() => onEdit(section, attachment.id)} className="block h-full w-full text-left"><Card><CardHeader><CardTitle>{attachment.name}</CardTitle></CardHeader></Card></button></li>)}</ul> : null}
      {data[section].length === 0 ? <Card><CardHeader><CardTitle>Henüz kayıt yok</CardTitle><CardDescription>Üstteki ekleme düğmesiyle bu tarayıcıda örnek kayıt oluşturabilirsin.</CardDescription></CardHeader></Card> : null}
    </>}
  </div>;
}
