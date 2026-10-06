import type { Metadata } from 'next';
import { RealDemoApp } from './real-demo-app';

export const metadata: Metadata = {
  title: 'Axon Fit demo',
  description: 'Axon Fit uygulamasını tek örnek danışanla tarayıcında dene.',
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <RealDemoApp />;
}
