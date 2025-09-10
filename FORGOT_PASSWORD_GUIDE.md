# Panduan Fungsi Lupa Kata Laluan

## Gambaran Keseluruhan

Sistem lupa kata laluan telah ditambah untuk membolehkan pengguna reset kata laluan mereka dengan selamat melalui email.

## Alur Kerja

### 1. Permintaan Reset Password

- Pengguna klik "Reset di sini" pada halaman login
- Masukkan email yang didaftarkan
- Sistem akan menghantar link reset (atau paparkan dalam console untuk development)

### 2. Reset Password

- Pengguna klik link dalam email
- Masukkan kata laluan baru (minimum 6 aksara)
- Sahkan kata laluan baru
- Sistem akan mengemaskini kata laluan

## Ciri-ciri Keselamatan

### Backend

- **Token Expiry**: Token reset tamat tempoh dalam 15 minit
- **One-time Use**: Token hanya boleh digunakan sekali
- **Secure Generation**: Token dijana menggunakan crypto.randomBytes
- **Auto Cleanup**: Token lama dibersihkan secara automatik

### Frontend

- **Token Validation**: Memastikan token sah sebelum paparan form
- **Password Confirmation**: Pengesahan kata laluan baru
- **Form Validation**: Validasi input yang ketat
- **User Feedback**: Maklum balas yang jelas untuk setiap langkah

## API Endpoints

### POST /api/auth/forgot-password

```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password

```json
{
  "token": "reset_token_here",
  "newPassword": "new_password_here"
}
```

### GET /api/auth/verify-reset-token/:token

Memastikan token reset masih sah.

## Halaman Frontend

### /forgot-password

- Form untuk memasukkan email
- Paparan status selepas email dihantar
- Link untuk hantar semula

### /reset-password?token=xxx

- Form untuk kata laluan baru
- Validasi token sebelum paparan
- Paparan status selepas berjaya

## Development Mode

Dalam development mode, link reset password akan dipaparkan dalam:

1. Console log backend
2. Toast notification frontend

## Production Setup

Untuk production, tambahkan:

1. Email service (SendGrid, AWS SES, dll)
2. Environment variable FRONTEND_URL
3. Remove development URL logging

## Testing

1. Pergi ke halaman login
2. Klik "Reset di sini"
3. Masukkan email yang didaftarkan
4. Periksa console untuk link reset (development)
5. Klik link dan set kata laluan baru
6. Log masuk dengan kata laluan baru
