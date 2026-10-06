'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Plus } from '@phosphor-icons/react';
import { ClientDayPlan } from '@/app/me/client-day-plan';
import { TodayWorkout } from '@/app/me/today-workout';
import { WorkoutScreen } from '@/app/me/antrenman/workout-screen';
import { ProgramForm } from '@/app/dashboard/clients/[id]/program/program-form';
import { DashboardDock } from '@/app/dashboard/nav';
import { UserMenu } from '@/app/dashboard/user-menu';
import { ClientDock } from '@/app/me/client-dock';
import { ClientHeader } from '@/app/me/client-header';
import { DayPlan } from '@/components/program/day-plan';
import { PageHeader } from '@/components/page-header';
import { SectionHeader } from '@/components/section-header';
import { CameraWizard } from '@/components/measurements/camera-wizard';
import { CameraHistory } from '@/components/measurements/camera-history';
import { MeasurementForm } from '@/app/dashboard/clients/[id]/measurements/measurement-form';
import { MeasurementOverview } from '@/app/dashboard/clients/[id]/measurements/measurement-overview';
import { ExerciseForm } from '@/app/dashboard/exercises/exercise-form';
import { DeviceForm } from '@/app/dashboard/devices/device-form';
import { TemplateForm } from '@/app/dashboard/templates/template-form';
import { AttachmentForm } from '@/app/dashboard/attachments/attachment-form';
import { DemoLibrary, type LibraryData, type LibrarySection } from './demo-library';
import { TrainingTabs } from '@/app/dashboard/training-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DEVICE_LIBRARY } from '@/data/device-library';
import { EXERCISE_LIBRARY } from '@/data/exercise-library';
import { formatNumber, todayIn } from '@/lib/format';
import { addMeasurements, measurementsOn, removeMeasurementDate, replaceMeasurements, slotsFromValues, type MeasurementValue } from '@/lib/measurement-log';
import { nextDayId, currentPhaseOf } from '@/lib/program-plan';
import type { SessionDoc } from '@/lib/schemas/session';
import type { HealthRecord } from '@/lib/schemas/health';
import { withCameraMeasurement, withCameraTrash, type CameraMeasurement } from '@/lib/schemas/camera-measurement';
import type { Client } from '@/lib/schemas/client';
import type { Program } from '@/lib/schemas/program';
import type { Exercise } from '@/lib/schemas/exercise';
import type { Device } from '@/lib/schemas/device';
import type { Template } from '@/lib/schemas/template';
import type { Attachment } from '@/lib/schemas/attachment';
import { pickerDevices, pickerExercises } from '@/lib/picker-data';
import { demoProgram } from '@/lib/testing/demo-fixtures';
import { buildWorkoutDay, programStamp } from '@/lib/workout-plan';
import type { WorkoutResponse } from '@/lib/workout-routes';
import { clearLocalWorkout, clearWorkoutCache } from '@/app/me/workout-storage';
import { programDraftKey } from '@/lib/unsaved-changes';

const CLIENT_ID = 'c_demo001';
const KEY = 'axon-fit-real-app-demo-v1';
const TIME_ZONE = 'Europe/Istanbul';
const exercises = EXERCISE_LIBRARY.map(item => ({ ...item, source: 'library' as const }));
const devices = DEVICE_LIBRARY.map(item => ({ ...item, source: 'library' as const }));
const sampleClient: Client = { id: CLIENT_ID, name: 'Örnek Danışan', createdAt: '2026-01-01T00:00:00.000Z', status: 'active', modules: { health: { enabled: false, fields: [] } }, consents: {}, access: { version: 1 }, visibleTo: [] };

type DemoData = LibraryData & { program: Program; sessions: SessionDoc[]; health: HealthRecord };
type View = 'pt' | 'edit' | 'overview' | 'measurements' | 'measurement-form' | 'camera' | 'library' | 'library-form' | 'client' | 'workout' | 'history' | 'progress' | 'client-programs' | 'client-camera';
const initialData = (): DemoData => {
  const program = demoProgram();
  const day = program.phases[0]?.days[0];
  const now = new Date().toISOString();
  const fourWeeksAgo = todayIn(TIME_ZONE, new Date(Date.now() - 28 * 24 * 60 * 60 * 1000));
  const today = todayIn(TIME_ZONE, new Date());
  const template: Template | null = day ? { id: 't_demo0001', name: 'Örnek tam vücut', description: 'Programdaki ilk antrenman günü', blocks: day.blocks, createdAt: now, updatedAt: now, sharedWithClients: true } : null;
  return { program, sessions: [], health: { version: 2, checkIns: [], measurements: [
    { date: fourWeeksAgo, id: 'body_mass', value: 82 },
    { date: today, id: 'body_mass', value: 80.6 },
    { date: fourWeeksAgo, id: 'sit_to_stand_5x', value: 14.8 },
    { date: today, id: 'sit_to_stand_5x', value: 12.4 },
  ], cameraMeasurements: [] }, exercises, devices, templates: template ? [template] : [], attachments: [] };
};

function readData(): DemoData {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as DemoData | null;
    if (value?.program?.version === 2 && Array.isArray(value.program.phases) && Array.isArray(value.sessions)) {
      const sample = initialData();
      return { ...sample, ...value, health: value.health?.measurements ? value.health : sample.health, exercises: Array.isArray(value.exercises) ? value.exercises : sample.exercises, devices: Array.isArray(value.devices) ? value.devices : sample.devices, templates: Array.isArray(value.templates) ? value.templates : sample.templates, attachments: Array.isArray(value.attachments) ? value.attachments : sample.attachments };
    }
  } catch { /* Invalid local state starts from the sample program. */ }
  return initialData();
}

function workoutResponse(data: DemoData): WorkoutResponse {
  const phase = currentPhaseOf(data.program)?.phase;
  const next = nextDayId(data.program);
  const today = todayIn(TIME_ZONE, new Date());
  const plan = buildWorkoutDay({ program: data.program, exercises: new Map(data.exercises.map(item => [item.id, item])), devices: new Map(data.devices.map(item => [item.id, item])), history: data.sessions });
  return {
    today,
    timeZone: TIME_ZONE,
    program: phase ? {
      revision: data.program.revision,
      stamp: programStamp(data.program),
      phaseId: phase.id,
      nextDayId: next,
      days: phase.days.map(day => ({ id: day.id, name: day.name })),
      source: 'pt',
    } : null,
    day: plan,
    week: { done: data.sessions.length, target: 3, days: [...new Set(data.sessions.map(session => session.date))], start: today },
    schedule: null,
    water: { file: 0, sessions: 0 },
    active: null,
    extras: {},
    health: { pain: false },
  };
}

/** The real app components call their normal fetch paths. In this route, those calls resolve against one browser-only sample. */
function demoFetch(original: typeof fetch, latest: React.RefObject<DemoData>, update: (change: (data: DemoData) => DemoData) => void): typeof fetch {
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    if (!url.pathname.startsWith('/api/')) return original(input, init);
    const method = init?.method?.toUpperCase() ?? (input instanceof Request ? input.method : 'GET');
    const body = () => JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    if (url.pathname === '/api/me/workout' && (!init?.method || init.method === 'GET')) {
      return Response.json(workoutResponse(latest.current));
    }
    if (/^\/api\/me\/sessions\/[^/]+$/.test(url.pathname) && method === 'PUT') {
      return Response.json({ doc: JSON.parse(String(init?.body)) });
    }
    if (/^\/api\/me\/sessions\/[^/]+\/finish$/.test(url.pathname) && method === 'POST') {
      const session = body().doc as SessionDoc;
      update(data => ({ ...data, sessions: [session, ...data.sessions.filter(item => item.id !== session.id)] }));
      return Response.json({ doc: session });
    }
    if (url.pathname === '/api/exercises' && method === 'GET') return Response.json({ exercises: latest.current.exercises });
    if (url.pathname === '/api/exercises' && method === 'POST') {
      const entry = body() as Exercise & { id?: string };
      const id = entry.id ?? `demo-${crypto.randomUUID().slice(0, 8)}`;
      update(data => ({ ...data, exercises: [...data.exercises.filter(item => item.id !== id), { ...entry, id, source: 'custom' }] }));
      return Response.json({ id });
    }
    if (/^\/api\/exercises\/[^/]+\/alternatives$/.test(url.pathname) && method === 'PUT') {
      const id = url.pathname.split('/')[3];
      const alternatives = body().alternatives as string[];
      update(data => ({ ...data, exercises: data.exercises.map(item => item.id === id ? { ...item, alternatives } : item) }));
      return Response.json({ ok: true });
    }
    if (url.pathname === '/api/devices' && method === 'POST') {
      const entry = body() as Device & { id?: string };
      const id = entry.id ?? `demo-${crypto.randomUUID().slice(0, 8)}`;
      update(data => ({ ...data, devices: [...data.devices.filter(item => item.id !== id), { ...entry, id, source: 'custom' }] }));
      return Response.json({ id });
    }
    if (url.pathname === '/api/attachments' && method === 'POST') {
      const entry = body() as Attachment & { id?: string };
      const id = entry.id ?? `demo-${crypto.randomUUID().slice(0, 8)}`;
      update(data => ({ ...data, attachments: [...data.attachments.filter(item => item.id !== id), { ...entry, id }] }));
      return Response.json({ id });
    }
    if (url.pathname === '/api/templates' && method === 'POST') {
      const entry = body() as Template & { id?: string };
      const id = entry.id ?? `t_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`;
      const now = new Date().toISOString();
      update(data => ({ ...data, templates: [...data.templates.filter(item => item.id !== id), { ...entry, id, createdAt: data.templates.find(item => item.id === id)?.createdAt ?? now, updatedAt: now }] }));
      return Response.json({ id, sha: '0000000000000000000000000000000000000000' });
    }
    if (/^\/api\/(devices|attachments)\/[^/]+\/image$/.test(url.pathname)) {
      return Response.json({ error: 'Görsel yükleme bu yerel demoda bulunmuyor.' }, { status: 501 });
    }
    if (url.pathname === `/api/clients/${CLIENT_ID}/measurements` && method === 'POST') {
      const entry = body() as { date: string; values: MeasurementValue[]; sex?: HealthRecord['sex'] };
      update(data => ({ ...data, health: { ...data.health, sex: entry.sex ?? data.health.sex, measurements: addMeasurements(data.health.measurements, entry.date, entry.values) } }));
      return Response.json({ ok: true });
    }
    const measurementDate = url.pathname.match(new RegExp(`^/api/clients/${CLIENT_ID}/measurements/(\\d{4}-\\d{2}-\\d{2})$`))?.[1];
    if (measurementDate && method === 'PUT') {
      const entry = body() as { values: MeasurementValue[]; sex?: HealthRecord['sex'] };
      update(data => ({ ...data, health: { ...data.health, sex: entry.sex ?? data.health.sex, measurements: replaceMeasurements(data.health.measurements, measurementDate, entry.values) } }));
      return Response.json({ ok: true });
    }
    if (measurementDate && method === 'DELETE') {
      update(data => ({ ...data, health: { ...data.health, measurements: removeMeasurementDate(data.health.measurements, measurementDate) } }));
      return Response.json({ ok: true });
    }
    if (url.pathname === `/api/clients/${CLIENT_ID}/camera-measurements` && method === 'POST') {
      try {
        const entry = body() as CameraMeasurement;
        update(data => ({ ...data, health: withCameraMeasurement(data.health, entry) }));
        return Response.json({ ok: true });
      } catch { return Response.json({ error: 'Kamera ölçümü kaydedilemedi.' }, { status: 400 }); }
    }
    if (url.pathname === `/api/clients/${CLIENT_ID}/camera-measurements` && method === 'PATCH') {
      try {
        const change = body() as { id: string; action: 'trash' | 'restore' };
        update(data => ({ ...data, health: withCameraTrash(data.health, change.id, change.action === 'trash', new Date().toISOString()) }));
        return Response.json({ ok: true });
      } catch { return Response.json({ error: 'Kamera ölçümü güncellenemedi.' }, { status: 400 }); }
    }
    return Response.json({ error: 'Bu işlem demo kapsamında değil.' }, { status: 404 });
  };
}

export function RealDemoApp() {
  const [data, setData] = useState<DemoData>(initialData);
  const [view, setView] = useState<View>('pt');
  const [librarySection, setLibrarySection] = useState<LibrarySection>('templates');
  const [libraryEditId, setLibraryEditId] = useState<string | null>(null);
  const [measurementDate, setMeasurementDate] = useState<string | null>(null);
  const [finishOnOpen, setFinishOnOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const latest = useRef(data);
  useEffect(() => { latest.current = data; }, [data]);

  useEffect(() => {
    const original = window.fetch.bind(window);
    window.fetch = demoFetch(original, latest, change => setData(change));
    const frame = window.requestAnimationFrame(() => {
      setData(readData());
      setReady(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.fetch = original;
    };
  }, []);
  useEffect(() => {
    if (ready) window.localStorage.setItem(KEY, JSON.stringify(data));
  }, [ready, data]);

  const saveProgram = async <T,>(_url: string, init?: RequestInit): Promise<T> => {
    const body = JSON.parse(String(init?.body ?? '{}')) as {
      phased: boolean; currentPhaseId: string; phases: Program['phases']; weekdays: number[];
    };
    const revision = latest.current.program.revision + 1;
    const now = new Date().toISOString();
    setData(previous => ({
      ...previous,
      program: {
        ...previous.program,
        phased: body.phased,
        phases: body.phases,
        current: { ...previous.program.current, phaseId: body.currentPhaseId },
        schedule: { weekdays: body.weekdays },
        revision,
        updatedAt: now,
      },
    }));
    clearWorkoutCache(CLIENT_ID);
    return { revision } as T;
  };

  const reset = () => {
    clearLocalWorkout(CLIENT_ID);
    clearWorkoutCache(CLIENT_ID);
    window.localStorage.removeItem(programDraftKey(CLIENT_ID));
    window.localStorage.removeItem('pulsecoach.draft.template.new');
    setData(initialData());
    setView('pt');
  };
  const program = data.program;
  const phase = currentPhaseOf(program)?.phase;
  const next = phase?.days.find(day => day.id === nextDayId(program));
  const rows = next?.blocks.flatMap(block => block.rows) ?? [];
  const setCount = rows.reduce((sum, row) => sum + row.sets.length, 0);
  const exerciseMap = new Map(data.exercises.map(item => [item.id, item]));
  const libraryForm = (section: LibrarySection, id: string | null) => { setLibrarySection(section); setLibraryEditId(id); setView('library-form'); };
  const ptNavigate = (page: 'overview' | 'clients' | 'library') => setView(page === 'overview' ? 'overview' : page === 'library' ? 'library' : 'pt');
  const ptLink = (event: React.MouseEvent<HTMLDivElement>) => {
    const href = (event.target as HTMLElement).closest('a')?.getAttribute('href');
    if (!href || !href.startsWith('/dashboard/')) return;
    if (href.startsWith(`/dashboard/clients/${CLIENT_ID}/measurements`)) {
      event.preventDefault();
      if (href.includes('/camera')) setView('camera');
      else if (href.endsWith('/new')) { setMeasurementDate(null); setView('measurement-form'); }
      else if (href.includes('/edit')) { setMeasurementDate(href.split('/').at(-2) ?? null); setView('measurement-form'); }
      else setView('measurements');
      return;
    }
    const section = href.split('/')[2];
    if (section === 'templates' || section === 'exercises' || section === 'devices' || section === 'attachments') {
      event.preventDefault();
      setLibrarySection(section);
      const id = href.split('/')[3];
      if (id === 'new' || id) libraryForm(section, id === 'new' ? null : id);
      else setView('library');
    }
  };

  const actions = { switchRole: () => setView(['client', 'history', 'progress', 'client-programs', 'client-camera'].includes(view) ? 'pt' : 'client'), reset };
  const isClientView = ['client', 'history', 'progress', 'client-programs', 'client-camera'].includes(view);
  const today = todayIn(TIME_ZONE, new Date());
  const measurementDays = [...new Set(data.health.measurements.map(item => item.date))];
  const libraryItem = data[librarySection].find(item => item.id === libraryEditId);
  const ptBody = view === 'edit' ? <div className="flex flex-col gap-6"><SectionHeader title="Programı düzenle" description="Örnek danışan · Değişiklikler bu tarayıcıya kaydedilir." back={{ href: `/dashboard/clients/${CLIENT_ID}`, label: 'Danışan' }} /><ProgramForm key={program.revision} clientId={CLIENT_ID} mode="edit" initial={{ phased: program.phased, currentPhaseId: program.current.phaseId, phases: program.phases, weekdays: program.schedule?.weekdays ?? [] }} base={{ revision: program.revision, createdAt: program.createdAt }} stored={{ current: program.current, rotation: program.rotation }} templates={data.templates.map(item => ({ id: item.id, name: item.name, blocks: item.blocks }))} exercises={pickerExercises(data.exercises)} devices={pickerDevices(data.devices)} now={new Date().toISOString()} timeZone={TIME_ZONE} transport={saveProgram} onSaved={() => setView('pt')} /></div>
    : view === 'measurements' ? <div className="flex flex-col gap-6"><SectionHeader title="Ölçümler" description="Kamerayla alınan açı ölçümleri ve elle girilen ölçümler." back={{ href: `/dashboard/clients/${CLIENT_ID}`, label: 'Örnek danışan' }} /><div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Yeni ölçüm"><Button className="h-auto min-h-24 w-full justify-start gap-4 rounded-xl px-5 py-4 text-left whitespace-normal" onClick={() => setView('camera')}><Camera aria-hidden className="size-8" /><span className="flex min-w-0 flex-col gap-1"><span className="text-lg font-semibold">Kamerayla ölçüm al</span><span className="text-sm font-normal">Duruş ve hareket açılarını adım adım ölç.</span></span></Button><Button variant="secondary" className="h-auto min-h-24 w-full justify-start gap-4 rounded-xl border-border px-5 py-4 text-left whitespace-normal" onClick={() => { setMeasurementDate(null); setView('measurement-form'); }}><Plus aria-hidden weight="fill" className="size-8" /><span className="flex min-w-0 flex-col gap-1"><span className="text-lg font-semibold">Manuel ölçüm gir</span><span className="text-sm font-normal">Aldığın ölçüm ve test değerlerini kaydet.</span></span></Button></div><CameraHistory clientId={CLIENT_ID} timeZone={TIME_ZONE} records={data.health.cameraMeasurements ?? []} /><h2 className="font-heading text-lg font-semibold">Manuel ölçüm geçmişi</h2><MeasurementOverview record={data.health} base={`/dashboard/clients/${CLIENT_ID}/measurements`} today={today} /></div>
    : view === 'measurement-form' ? <MeasurementForm key={measurementDate ?? 'new'} clientId={CLIENT_ID} mode={measurementDate ? { kind: 'edit', date: measurementDate } : { kind: 'new', today, measuredDates: measurementDays }} initialValues={measurementDate ? slotsFromValues(measurementsOn(data.health.measurements, measurementDate)) : {}} askSex={!data.health.sex} title={measurementDate ? 'Ölçümü düzenle' : 'Yeni ölçüm'} description="Örnek danışan · Kayıt yalnız bu tarayıcıda tutulur." actions={measurementDate ? <Button variant="outline" onClick={() => { setData(previous => ({ ...previous, health: { ...previous.health, measurements: removeMeasurementDate(previous.health.measurements, measurementDate) } })); setView('measurements'); }}>Bu günü sil</Button> : undefined} onSaved={() => setView('measurements')} />
    : view === 'camera' ? <div className="flex flex-col gap-6"><SectionHeader title="Kamera ölçümü" description="Duruş ve hareket açılarını mevcut kamera sihirbazıyla ölç." back={{ href: `/dashboard/clients/${CLIENT_ID}/measurements`, label: 'Ölçümler' }} /><CameraWizard clientId={CLIENT_ID} clientName={sampleClient.name} backHref={`/dashboard/clients/${CLIENT_ID}/measurements`} manualHref={`/dashboard/clients/${CLIENT_ID}/measurements/new`} timeZone={TIME_ZONE} records={data.health.cameraMeasurements ?? []} /></div>
    : view === 'library' ? <DemoLibrary section={librarySection} data={data} onSection={section => setLibrarySection(section)} onEdit={libraryForm} />
    : view === 'library-form' ? <div className="flex flex-col gap-6"><TrainingTabs demo={{ active: `/dashboard/${librarySection}`, navigate: href => { setLibrarySection(href.split('/')[2] as LibrarySection); setView('library'); } }} /><SectionHeader title={`${libraryEditId ? 'Düzenle' : 'Yeni'} · ${{ templates: 'Şablon', exercises: 'Egzersiz', devices: 'Cihaz', attachments: 'Aparat' }[librarySection]}`} back={{ href: `/dashboard/${librarySection}`, label: 'Kütüphane' }} />{librarySection === 'templates' ? <TemplateForm key={libraryEditId ?? 'new'} editing={libraryItem ? { template: libraryItem as Template, sha: '0000000000000000000000000000000000000000' } : null} exercises={pickerExercises(data.exercises)} devices={pickerDevices(data.devices)} timeZone={TIME_ZONE} onSaved={() => setView('library')} /> : librarySection === 'exercises' ? <ExerciseForm key={libraryEditId ?? 'new'} editing={libraryItem as Exercise | null} devices={data.devices} attachments={data.attachments} onSaved={() => setView('library')} /> : librarySection === 'devices' ? <DeviceForm key={libraryEditId ?? 'new'} editing={libraryItem as Device | null} attachments={data.attachments} onSaved={() => setView('library')} /> : <AttachmentForm key={libraryEditId ?? 'new'} editing={libraryItem as Attachment | null} onSaved={() => setView('library')} />}</div>
    : view === 'overview' ? <div className="flex flex-col gap-6"><PageHeader title="Genel bakış" description="Bir örnek danışan ve yerel demo kayıtları." /><Card><CardHeader><CardTitle>Örnek danışan</CardTitle><CardDescription>{data.sessions.length} antrenman · {measurementDays.length} ölçüm günü</CardDescription></CardHeader><CardFooter><Button onClick={() => setView('pt')}>Danışanı aç</Button></CardFooter></Card></div>
    : <div className="flex flex-col gap-6"><PageHeader title="Örnek danışan" description="Program, antrenman ve ölçümler tek örnek danışana bağlı." /><div className="grid gap-3 sm:grid-cols-2"><Card><CardHeader><CardTitle>Program</CardTitle><CardDescription>{phase?.days.length ?? 0} gün · Sıradaki gün {next?.name ?? 'yok'}</CardDescription></CardHeader><CardContent>{next ? <DayPlan blocks={next.blocks} exercises={exerciseMap} missing="show" /> : 'Henüz gün yok.'}</CardContent><CardFooter><Button onClick={() => setView('edit')}>Programı düzenle</Button></CardFooter></Card><Card><CardHeader><CardTitle>Ölçümler</CardTitle><CardDescription>{measurementDays.length} manuel ölçüm günü · {data.health.cameraMeasurements?.length ?? 0} kamera kaydı</CardDescription></CardHeader><CardFooter><Button onClick={() => setView('measurements')}>Ölçümleri aç</Button></CardFooter></Card></div><Card><CardHeader><CardTitle>Danışanın antrenmanları</CardTitle><CardDescription>{data.sessions.length} antrenman tamamlandı</CardDescription></CardHeader><CardContent>{data.sessions.length ? data.sessions.map(item => <p key={item.id} className="border-t py-2 text-sm">{item.date} · {item.entries.reduce((count, entry) => count + entry.sets.length, 0)} set</p>) : <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>}</CardContent></Card></div>;
  return <div className="dark min-h-dvh bg-background text-foreground">
    {!ready ? <div className="mx-auto max-w-5xl px-4 py-10">Demo açılıyor…</div> : view === 'workout' ? (
      <div className="mx-auto max-w-md px-4 py-4"><WorkoutScreen clientId={CLIENT_ID} dayParam={null} finishOnOpen={finishOnOpen} onDemoLeave={() => setView('client')} onDemoFinished={() => setView('history')} /></div>
    ) : !isClientView ? <>
      <div className="relative mx-auto w-full max-w-5xl px-4 md:px-8" onClickCapture={ptLink}>
        <div data-reorder-hide className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-30 md:right-8"><UserMenu login="ornek" appName="Axon Fit" demo={actions} /></div>
        <main className="pt-[calc(max(0.75rem,env(safe-area-inset-top))_+_0.75rem)] pb-32">
          {ptBody}
        </main>
      </div>
      <DashboardDock demo={{ active: view === 'overview' ? 'overview' : view === 'library' || view === 'library-form' ? 'library' : 'clients', navigate: ptNavigate }} />
    </> : <>
      <div className="mx-auto w-full max-w-md overflow-x-clip px-4 pt-[max(2rem,calc(env(safe-area-inset-top)+0.75rem))] pb-[calc(var(--dock-clearance)+0.5rem)]" onClickCapture={event => {
        if ((event.target as HTMLElement).closest('a')?.getAttribute('href') === '/demo') {
          event.preventDefault();
          setView('progress');
        }
      }}>
        <main className="flex flex-col gap-6">
          <ClientHeader client={sampleClient} appName="Axon Fit" title={view === 'history' ? 'Geçmiş' : view === 'progress' ? 'İlerleme' : view === 'client-programs' ? 'Programlar' : view === 'client-camera' ? 'Kamera ölçümü' : 'Merhaba, Örnek'} demo={actions} />
          {view === 'history' ? <div className="flex flex-col gap-3">{data.sessions.length ? data.sessions.map(session => <Card key={session.id}><CardHeader><CardTitle>{session.program?.dayName ?? 'Antrenman'}</CardTitle><CardDescription>{session.date}</CardDescription></CardHeader><CardContent>{session.entries.reduce((count, entry) => count + entry.sets.length, 0)} set kaydedildi</CardContent></Card>) : <Card><CardHeader><CardTitle>Henüz antrenman yok</CardTitle></CardHeader></Card>}</div> : view === 'progress' ? <div className="flex flex-col gap-5"><Card><CardHeader><CardTitle>Ölçümler</CardTitle><CardDescription>PT’nin girdiği ölçümler ve kamera kayıtları</CardDescription></CardHeader><CardFooter><Button onClick={() => setView('client-camera')}>Kamerayla ölçüm al</Button></CardFooter></Card><CameraHistory records={data.health.cameraMeasurements ?? []} timeZone={TIME_ZONE} /><MeasurementOverview record={data.health} base="/demo" today={today} readOnly /></div> : view === 'client-camera' ? <CameraWizard clientId={CLIENT_ID} clientName={sampleClient.name} backHref="/demo" manualHref="/demo" manualLabel="İlerlemeye dön" timeZone={TIME_ZONE} records={data.health.cameraMeasurements ?? []} /> : view === 'client-programs' ? <Card><CardHeader><CardTitle>Aktif program</CardTitle><CardDescription>{phase?.days.length ?? 0} antrenman günü</CardDescription></CardHeader><CardContent>{phase?.days.map(day => <div key={day.id} className="border-t py-4"><h2 className="mb-3 font-semibold">{day.name}</h2><ClientDayPlan blocks={day.blocks} exercises={exerciseMap} /></div>)}</CardContent></Card> : <TodayWorkout clientId={CLIENT_ID} demo={{ resume: () => { setFinishOnOpen(false); setView('workout'); }, finish: () => { setFinishOnOpen(true); setView('workout'); } }}><Card><CardHeader><CardDescription>Bugünün antrenmanı · {next?.name ?? 'Program yok'}</CardDescription><CardTitle className="text-xl">{next?.name ?? 'Program yok'}</CardTitle><CardDescription>{formatNumber(rows.length)} hareket · {formatNumber(setCount)} set</CardDescription></CardHeader><CardContent>{next ? <ClientDayPlan blocks={next.blocks} exercises={exerciseMap} /> : null}</CardContent><CardFooter><Button className="w-full" disabled={!next} onClick={() => { setFinishOnOpen(false); setView('workout'); }}>Antrenmana başla</Button></CardFooter></Card></TodayWorkout>}
        </main>
      </div>
      <ClientDock demo={{ active: view === 'history' ? 1 : view === 'progress' || view === 'client-camera' ? 2 : view === 'client-programs' ? 3 : 0, navigate: tab => setView(tab === 1 ? 'history' : tab === 2 ? 'progress' : tab === 3 ? 'client-programs' : 'client') }} />
    </>}
  </div>;
}
