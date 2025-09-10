# Debug Instructions untuk Create Invoice Issue

## 1. Langkah untuk debug:

### Backend Terminal:
1. Pastikan backend running dengan `npm run dev`
2. Lihat console output untuk debug messages

### Frontend Browser:
1. Buka Developer Tools (F12)
2. Pergi ke Console tab
3. Cuba create invoice baru
4. Lihat logs yang keluar

## 2. Yang perlu dicheck:

### Di Frontend Console:
- `=== FRONTEND SUBMIT DEBUG ===`
- Form data yang dihantar
- Processed form data
- Server response atau error

### Di Backend Terminal:
- `=== CREATE INVOICE DEBUG ===`
- Request body yang diterima
- User ID
- Validation steps
- MongoDB save operation
- Any errors

## 3. Common Issues dan Solutions:

### Jika backend menunjukkan "missing required fields":
- Check form inputs semua diisi
- Pastikan due date dipilih
- Pastikan ada sekurang-kurangnya 1 item

### Jika validation error pada items:
- Check item description tidak kosong
- Check quantity > 0
- Check unit price >= 0

### Jika database connection error:
- Pastikan MongoDB running
- Check .env file MONGODB_URI

### Jika authentication error:
- Check user logged in
- Check JWT token valid

## 4. Quick Test Steps:
1. Login ke sistem
2. Pergi ke "Cipta Invois Baru"
3. Isi semua field:
   - Nama pelanggan
   - Email pelanggan  
   - Alamat pelanggan
   - Tarikh jatuh tempo
   - Minimum 1 item dengan description, quantity, unit price
4. Click "Simpan Invois"
5. Lihat console logs untuk debug info

Cuba ikut steps ini dan bagitahu apa yang keluar di console!