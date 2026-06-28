// src/theme/colors.js

// Static colors that don't change with the dynamic primary color
export const staticColors = {
  background: '#f8f9fa', // Sangat abu-abu muda untuk latar belakang
  surface: '#ffffff',    // Putih murni untuk Card/Background input
  textMain: '#111111',   // Hitam keabu-abuan untuk teks judul
  textMuted: '#6c757d',  // Abu-abu untuk teks deskripsi/label
  border: '#e9ecef',     // Abu-abu sangat terang untuk garis
  borderDark: '#dee2e6', // Abu-abu terang untuk garis input
  danger: '#dc3545',     // Merah untuk logout/error
  dangerLight: '#fceaea',// Merah pudar untuk background logout
};

/**
 * Utility function to convert a Hex color (e.g. #124068) to an RGBA color.
 * This is used to generate the "primaryLight" background for badges/icons automatically.
 * 
 * @param {string} hex - The hex color code
 * @param {number} opacity - The opacity value (0.0 to 1.0)
 * @returns {string} - rgba color string
 */
export const hexToRgba = (hex, opacity) => {
  // Menghapus '#' jika ada
  let c = hex.replace('#', '');
  
  // Jika formatnya 3 karakter (e.g. #FFF), ubah ke 6 karakter
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }

  // Parse r, g, b
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  // Jika input salah, kembalikan warna default transparan
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(18, 64, 104, ${opacity})`; 
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
