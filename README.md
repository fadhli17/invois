# 📊 Invoice Management System

Sistem pengurusan invois yang lengkap dengan fungsi diskaun, tracking pembayaran, dan mod teks bebas.

## ✨ Features

### 📋 Document Management

- **Invoice & Quote Creation** - Cipta invois dan sebut harga
- **Discount Functionality** - Diskaun dalam RM atau peratus (%)
- **Payment Tracking** - Rekod pembayaran dengan nota
- **Status Management** - Draft, Sent, Paid, Overdue

### 🎯 Item Management

- **Structured Mode** - Format jadual tradisional
- **Freeform Mode** - Format teks bebas dengan auto-detection
- **Smart Analysis** - Auto-detect harga dan kuantiti dari teks

### 👥 Customer Management

- **Customer Database** - Simpan maklumat pelanggan
- **Quick Selection** - Pilih pelanggan sedia ada
- **Address Management** - Alamat lengkap pelanggan

### 📊 Reports & Analytics

- **Dashboard** - Statistik pembayaran dan pendapatan
- **Payment Reports** - Laporan pembayaran terperinci
- **Overdue Tracking** - Pantau dokumen lewat tempoh

### 🎨 User Experience

- **Responsive Design** - Mobile-friendly interface
- **Collapsible Sections** - UI yang bersih dan professional
- **Real-time Calculations** - Pengiraan automatik
- **PDF Generation** - Cetak invois dalam format PDF

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 atau lebih tinggi)
- MongoDB
- npm atau yarn

### Installation

1. **Clone Repository**

```bash
git clone https://github.com/fadhli17/invois.git
cd invois
```

2. **Install Dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Setup**

```bash
# Backend .env file
cd backend
cp .env.example .env
# Edit .env dengan maklumat database anda
```

4. **Start Application**

```bash
# Backend (Terminal 1)
cd backend
npm start

# Frontend (Terminal 2)
cd frontend
npm start
```

5. **Access Application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🛠️ Technology Stack

### Frontend

- **React** - UI Framework
- **React Router** - Navigation
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications

### Backend

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads

## 📁 Project Structure

```
invois/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── uploads/         # File uploads
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── utils/       # Utility functions
│   │   └── config/      # Configuration
│   └── public/          # Static files
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invois
JWT_SECRET=your-secret-key
```

### Frontend Configuration

```javascript
// src/config/api.js
export const API_BASE_URL = "http://localhost:5000";
```

## 📊 Database Schema

### Invoice Model

```javascript
{
  invoiceNumber: String,
  documentType: ['invoice', 'quote'],
  clientName: String,
  clientEmail: String,
  clientAddress: String,
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number
  }],
  freeformItems: String,
  subtotal: Number,
  discount: Number,        // NEW: Discount amount
  discountType: String,    // NEW: 'amount' or 'percent'
  tax: Number,
  total: Number,
  payments: [{
    amount: Number,
    date: Date,
    note: String
  }],
  status: ['draft', 'sent', 'paid', 'overdue']
}
```

## 🎯 Key Features Explained

### Discount Functionality

- **RM Discount**: Fixed amount discount
- **% Discount**: Percentage-based discount
- **Auto Calculation**: Automatic total calculation
- **Display**: Clear discount breakdown in UI

### Payment Tracking

- **Multiple Payments**: Record multiple payment instances
- **Payment Notes**: Add notes for each payment
- **Outstanding Balance**: Automatic outstanding calculation
- **Payment History**: Complete payment timeline

### Freeform Mode

- **Smart Detection**: Auto-detect prices and quantities
- **Flexible Format**: Support various text formats
- **Real-time Analysis**: Live analysis of freeform text
- **Fallback Support**: Graceful handling of unrecognized formats

## 🚀 Deployment

### VPS Deployment

```bash
# Clone repository
git clone https://github.com/fadhli17/invois.git
cd invois

# Install dependencies
cd backend && npm install
cd ../frontend && npm install && npm run build

# Start with PM2
pm2 start backend/server.js --name "invois-backend"
pm2 serve frontend/build 3000 --name "invois-frontend"
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Fadhli**

- GitHub: [@fadhli17](https://github.com/fadhli17)
- Repository: [https://github.com/fadhli17/invois](https://github.com/fadhli17/invois)

## 🙏 Acknowledgments

- React community for excellent documentation
- MongoDB for robust database solution
- Tailwind CSS for beautiful styling
- All contributors and users

---

**⭐ Jika aplikasi ini membantu, sila berikan star di GitHub!**
