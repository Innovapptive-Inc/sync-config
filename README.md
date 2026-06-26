# Record Manager - MongoDB Admin Interface

A production-quality, user-friendly Next.js application that allows non-technical users to view and update MongoDB records through a simple web interface.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Features

### User Experience
- 🎨 **Clean, Modern UI** - Intuitive design that anyone can use
- ✅ **Real-time Validation** - Instant feedback on form inputs
- 💾 **Unsaved Changes Warning** - Never lose work accidentally
- 🔔 **Toast Notifications** - Clear success/error messages
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🔄 **Loading States** - Smooth skeleton loaders
- ⚡ **Fast Performance** - Optimized for speed

### Technical
- ⚛️ **Next.js 16** with App Router
- 🗄️ **MongoDB** with Mongoose ODM
- 📝 **React Hook Form** for efficient form handling
- 🎨 **Tailwind CSS** for styling
- 🔥 **React Hot Toast** for notifications
- 🛡️ **Input Validation** with client and server-side checks
- 🔒 **Secure** - MongoDB IDs hidden from users

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd sync-configuration
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure MongoDB**
   
   Edit `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=sync_config_db
   COLLECTION_NAME=records
   ```

4. **Seed Database (Optional)**
   ```bash
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Browser**
   
   Visit [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

For detailed setup instructions, API documentation, and customization guide, see [SETUP.md](./SETUP.md).

## 🎯 Use Cases

- **Customer Information Management** - Update customer records without database access
- **Configuration Editor** - Safely modify application settings
- **User Profile Manager** - Allow users to edit their information
- **Content Management** - Update content stored in MongoDB
- **Admin Dashboard** - Simple CRUD operations for non-technical staff

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| React Hook Form | Form state management |
| Tailwind CSS | Styling |
| React Hot Toast | Notifications |
| Zod | Schema validation |

## 📁 Project Structure

```
sync-configuration/
├── app/
│   ├── api/record/          # API endpoints
│   ├── layout.jsx           # Root layout
│   ├── page.jsx             # Main page
│   └── globals.css          # Global styles
├── components/
│   ├── Header.jsx           # Header
│   ├── RecordForm.jsx       # Main form
│   ├── ConfirmModal.jsx     # Confirmation dialog
│   └── LoadingSkeleton.jsx  # Loading state
├── hooks/
│   └── useRecord.js         # Data fetching hook
├── lib/
│   └── mongodb.js           # DB connection
├── models/
│   └── Record.js            # Mongoose schema
└── scripts/
    └── seed.js              # Database seeder
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run seed     # Seed database with sample data
```

## 🎨 Key Features

### Main Form
Clean, intuitive interface with real-time validation and helpful tooltips.

### Confirmation Modal
Shows exactly what will change before saving - perfect for non-technical users.

### Success State
Clear feedback with animations and toast notifications.

## 🔐 Security

- ✅ Environment variables for sensitive data
- ✅ Server-side validation on all inputs
- ✅ MongoDB ObjectIDs never exposed to users
- ✅ Protection against invalid field updates
- ✅ Input sanitization and trimming
- ✅ Email format validation

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Works on any Node.js platform:
- Netlify
- Railway
- Render
- AWS
- DigitalOcean

## 📝 Customization

### Add New Fields

1. Update `models/Record.js`:
   ```javascript
   department: {
     type: String,
     trim: true,
   }
   ```

2. Add field in `components/RecordForm.jsx`:
   ```jsx
   <input
     {...register('department')}
     className="..."
   />
   ```

3. Update API validation in `app/api/record/route.js`

### Change Styling

All components use Tailwind CSS - simply modify the classes or update `tailwind.config.js`.

## 🐛 Troubleshooting

**MongoDB Connection Failed**
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `.env.local`
- Verify database allows connections

**Port Already in Use**
```bash
lsof -ti:3000 | xargs kill -9
```

**Module Not Found**
```bash
rm -rf node_modules .next
npm install
```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📧 Support

For questions or issues:
1. Check [SETUP.md](./SETUP.md)
2. Review error logs
3. Verify environment variables

---

**Built with ❤️ using Next.js, MongoDB, and Tailwind CSS**

Made for non-technical users who need to safely update database records without any coding knowledge.
