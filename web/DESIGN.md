---
name: Kyklos Design System
description: Sistem desain komunal yang bersih, hangat, dan terpercaya untuk komunitas lokal.
colors:
  primary: "#4F46E5"
  neutral-bg: "#ffffff"
  neutral-bg-dark: "#0a0a0a"
  neutral-fg: "#171717"
  neutral-fg-dark: "#ededed"
  border-gray: "#e5e7eb"
  gray-text: "#6b7280"
typography:
  display:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.75rem
  headline:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5rem
  body:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25rem
  label:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.gray-text}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Kyklos Design System

## 1. Overview

**Creative North Star: "The Friendly Local Ledger"**

Sistem desain Kyklos dirancang untuk menghadirkan rasa percaya, kehangatan, dan kesederhanaan bagi komunitas lokal di Indonesia. Pengguna kami meliputi anggota berbagai rentang usia, dari anak muda hingga orang tua, sehingga antarmuka harus meminimalkan beban kognitif dan memaksimalkan keterbacaan.

Aplikasi ini menggunakan tata letak layar tunggal/fokus (mobile-first container) yang terpusat untuk menjaga konsentrasi pengguna pada tugas utama tanpa gangguan. Kami menolak desain finansial yang terlalu padat, bagan analitik yang rumit, dan elemen dekoratif tanpa guna (seperti efek kaca palsu).

**Key Characteristics:**
- **Ramah & Komunal**: Sudut elemen yang membulat lembut (`rounded-2xl` atau `16px`) memberikan kesan bersahabat.
- **Keterbacaan Utama**: Angka saldo dan mutasi dana disajikan dengan ukuran yang dominan dan kontras tinggi.
- **Interaksi Pasti**: Setiap aksi memiliki umpan balik visual instan (transisi halus pada hover/tap).

## 2. Colors

Warna di Kyklos merepresentasikan transparansi dan keandalan.

### Primary
- **Indigo Trust** (#4F46E5): Digunakan sebagai warna utama aplikasi, menonjolkan keandalan dan aksi utama. Juga dikonfigurasi dinamis sebagai `--community-primary` untuk penyesuaian tema warna khas tiap komunitas.

### Neutral
- **Ink Black** (#171717): Digunakan untuk teks utama agar memiliki kontras maksimal.
- **Warm White** (#ffffff): Latar belakang utama aplikasi untuk kebersihan visual.
- **Muted Slate** (#6b7280): Digunakan untuk label sekunder, teks pembantu, dan informasi waktu transaksi.
- **Border Gray** (#e5e7eb): Pembatas bagian atau kartu untuk menjaga kebersihan hierarki spatial tanpa garis yang tajam.

### Named Rules
**The Community Color Rule.** Warna primer dapat digantikan oleh `--community-primary` untuk whitelabeling identitas komunitas, namun kontras teks terhadap warna tersebut harus selalu dipertahaman ≥ 4.5:1.

## 3. Typography

**Display Font:** Geist Sans (dengan fallback Arial, Helvetica, sans-serif)
**Body Font:** Geist Sans (dengan fallback Arial, Helvetica, sans-serif)

Mengingat ragam usia pengguna komunitas, ukuran huruf dioptimalkan untuk keterbacaan yang nyaman di perangkat seluler dengan perataan teks yang rapi.

### Hierarchy
- **Display** (700, 1.25rem / 20px, 1.75rem): Digunakan untuk judul halaman utama (misal: nama komunitas atau total saldo).
- **Headline** (600, 1rem / 16px, 1.5rem): Digunakan untuk judul kartu atau kategori transaksi.
- **Title** (600, 0.875rem / 14px, 1.25rem): Digunakan untuk ringkasan teks penting.
- **Body** (400, 0.875rem / 14px, 1.25rem): Digunakan untuk deskripsi transaksi, nama anggota, dan pesan umum.
- **Label** (500, 0.75rem / 12px, normal): Digunakan untuk status, kategori kecil, atau tanggal.

## 4. Elevation

Kyklos menggunakan pendekatan kedalaman datar berbasis lapisan (flat-layered) dengan bayangan yang sangat tipis untuk membedakan permukaan interaktif dari latar belakang.

### Shadow Vocabulary
- **Card Shadow** (`box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`): Digunakan untuk kartu konten yang dapat diklik.

### Named Rules
**The Interaction Shadow Rule.** Bayangan kartu hanya boleh meningkat tipis pada interaksi hover/focus sebagai umpan balik visual bahwa elemen tersebut dapat diklik.

## 5. Components

### Buttons
- **Shape:** Rounded-lg (8px)
- **Primary:** Latar belakang warna primer (`#4F46E5`), teks putih, padding vertikal 8px, horizontal 16px.
- **Hover / Focus:** Transisi opacity 90% atau peningkatan kecerahan tipis.

### Cards / Containers
- **Corner Style:** Rounded-2xl (16px)
- **Background:** Putih (`#ffffff`)
- **Shadow Strategy:** Card Shadow tipis.
- **Border:** Tipis (`#f3f4f6`)
- **Internal Padding:** 16px (`p-4`)

### Inputs / Fields
- **Style:** Stroke abu-abu tipis, sudut rounded-lg (8px), padding dalam `px-3 py-2`.
- **Focus:** Ring fokus menggunakan warna primer dengan ketebalan 2px.

## 6. Do's and Don'ts

### Do:
- **Do** berikan label yang jelas pada setiap angka nominal keuangan (misal: "Total Saldo Komunitas", "Pemasukan", "Pengeluaran").
- **Do** gunakan sudut 16px (`rounded-2xl`) untuk kartu utama dan 8px (`rounded-lg`) untuk tombol dan input.

### Don't:
- **Don't** menggunakan gradient teks atau efek glassmorphism yang mengurangi kontras teks keuangan.
- **Don't** menampilkan tabel dengan kolom yang sangat padat dan rapat yang membingungkan bagi pengguna non-teknis.
