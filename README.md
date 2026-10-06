# Axon Fit canlı demo

Bu repo [Axon Fit](https://github.com/gokerlek/axon-fit) uygulamasının gerçek arayüz bileşenlerinden hazırlanmış, ayrı yayınlanan etkileşimli demosudur. Tek örnek danışan ile antrenör ve danışan ekranları birbirine bağlıdır. Program, kütüphane, antrenman ve ölçüm işlemleri tarayıcının `localStorage` alanında tutulur. Kamera ölçümü, izin verilirse cihazda çalışır. Gerçek GitHub hesabı, giriş veya veri deposu kullanılmaz; sunucu API yolları kapalıdır.

Görsel dosya yükleme demo kapsamı dışındadır. Bu repo uygulamanın o anki kaynak anlık görüntüsüdür; asıl uygulamadaki değişiklikler kendiliğinden buraya gelmez.

## Geliştirme

Node.js 22 veya yenisiyle:

```bash
npm ci
npm run dev
```

`/` otomatik olarak `/demo` adresine yönlenir. `npm run build` üretim derlemesini doğrular.

## Vercel

Bu repoyu Next.js projesi olarak içeri al. Herhangi bir GitHub tokenı, Auth secret veya gerçek danışan verisi ortam değişkeni ekleme.
