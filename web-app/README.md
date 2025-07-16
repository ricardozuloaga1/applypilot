# AutoApply AI Web Application

A modern web application for job seekers to manage resumes, capture job postings, and generate tailored application documents using AI.

## 🚀 Features

- **Resume Management**: Upload and manage multiple resume versions
- **Job Tracking**: View captured job postings with match scores
- **Document Generation**: Create tailored resumes and cover letters
- **AI Enhancement**: Three modes for document optimization
- **Settings Management**: Configure API keys and preferences

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account (for database)
- OpenAI API key (for document generation)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd web-app
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the `web-app` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `../database-schema.sql`
3. Set up Row Level Security (RLS) policies
4. Create a storage bucket named `resumes`

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🎯 Usage Guide

### Landing Page
- Navigate to the homepage to see the product overview
- Click "Get Started Free" to access the dashboard

### Dashboard Navigation
The dashboard has 4 main tabs:

#### 1. Resume Upload
- Upload resume files (PDF, DOC, DOCX, TXT)
- Manage multiple resume versions
- Set an active resume for job matching

#### 2. Jobs
- View captured job postings (sample data included)
- See match scores for each job
- Select up to 3 jobs for document generation

#### 3. Generate
- Choose document type (Cover Letter, Resume, Both)
- Select format (PDF, Text)
- Pick AI enhancement mode:
  - **Precision Mode**: Conservative, factual
  - **Gap Filler Mode**: Addresses missing qualifications
  - **Beast Mode**: Aggressive enhancement
- Generate tailored documents

#### 4. Settings
- Configure OpenAI API key
- Set preferences for auto-scoring and notifications
- Save settings locally

## 🔧 Technical Details

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI API

### Key Components
- `app/page.tsx`: Landing page with animations
- `app/dashboard/page.tsx`: Main dashboard application
- `lib/supabase.ts`: Database client and helper functions

### Data Flow
1. User uploads resume → Stored in Supabase Storage + Database
2. Jobs captured via Chrome extension → Stored in jobs table
3. Document generation → Uses OpenAI API with resume + job data
4. Settings → Saved to localStorage

## 🔐 Security

- All sensitive data stored in Supabase with RLS
- API keys encrypted in localStorage
- File uploads validated for type and size
- CORS policies configured for production

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Build
```bash
npm run build
npm start
```

## 📝 Development Notes

### Current Limitations
- Text extraction only works for TXT files (PDF/DOC parsing needs implementation)
- Document generation is simulated (needs OpenAI integration)
- User authentication uses anonymous mode
- Job data includes sample data for demonstration

### Next Steps
1. Implement proper file parsing for PDF/DOC files
2. Add real OpenAI document generation
3. Implement user authentication
4. Add Chrome extension sync
5. Add real-time job matching scores

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Check your Supabase URL and API key
- Ensure RLS policies are properly configured

**File Upload Fails**
- Verify storage bucket exists and is accessible
- Check file size limits (5MB max)

**API Key Issues**
- Ensure OpenAI API key is valid
- Check API key permissions

### Debug Mode
Add `?debug=true` to any URL to enable debug logging.

## 📊 Project Structure

```
web-app/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard
│   ├── globals.css           # Global styles
│   └── layout.tsx            # App layout
├── components/
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── supabase.ts          # Database client
│   └── utils.ts             # Utility functions
├── public/                   # Static assets
└── styles/                   # Additional styles
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the existing issues
3. Create a new issue with detailed information

---

**Happy job hunting! 🎯** 