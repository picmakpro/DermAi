# 🧬 DermAI V2 - AI Dermatological Diagnosis

> Revolutionary dermatological diagnosis application using GPT-4o Vision for precise analysis and personalized recommendations.

## ✨ Features

- 🤖 **Advanced AI Analysis** - GPT-4o Vision for precise diagnosis
- 📸 **Professional Upload** - Intuitive drag & drop interface  
- 🎯 **Specific Diagnosis** - Precisely named conditions
- 📊 **Detailed Scores** - 8 skin parameters analyzed
- 🛍️ **Recommendations** - Personalized products and routine
- 📱 **Mobile-first** - Optimized responsive interface

## 🚀 Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI:** OpenAI GPT-4o Vision API
- **Analytics:** Google Analytics 4
- **Deployment:** Vercel with optimized serverless functions
- **Storage:** IndexedDB (local) + Supabase (cloud)

## 📚 **Documentation**

For complete documentation, see the [docs/](./docs/) folder:

### **🎯 Specifications & Architecture**
- **[spec-english.md](./docs/spec-english.md)** - Complete functional and technical specifications
- **[Database_Architecture_EN.md](./docs/Database_Architecture_EN.md)** - Supabase database architecture

### **📋 Planning & Strategy** 
- **[Roadmap_Planning_EN.md](./docs/Roadmap_Planning_EN.md)** - Detailed roadmap and planning
- **[monetization-strategy.md](./docs/monetization-strategy.md)** - Monetization strategy and internal catalog

### **🔬 Business Logic**
- **[Dermatological_Logic_EN.md](./docs/Dermatological_Logic_EN.md)** - 3-phase dermatological logic
- **[Educational_Interface_EN.md](./docs/Educational_Interface_EN.md)** - User educational interface

### **🚀 Improvement & Optimization**
- **[Diagnostic_Improvement_Strategy_EN.md](./docs/Diagnostic_Improvement_Strategy_EN.md)** - AI diagnostic improvement strategy

## 🎯 **Quick Start**

### **To get started:**
1. **Read [spec-english.md](./docs/spec-english.md)** for complete overview
2. **Check [Roadmap_Planning_EN.md](./docs/Roadmap_Planning_EN.md)** for roadmap
3. **Study [Dermatological_Logic_EN.md](./docs/Dermatological_Logic_EN.md)** for business logic

### **For development:**
- **Frontend/UI** → `spec-english.md` + `Educational_Interface_EN.md`
- **Backend/API** → `spec-english.md` + `Database_Architecture_EN.md`
- **AI/Diagnosis** → `Diagnostic_Improvement_Strategy_EN.md`
- **Business** → `monetization-strategy.md`

## ⚡ Quick Demo

```bash
# Clone the repository
git clone https://github.com/picmakpro/Dermai-en.git
cd dermai-v2-english

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your OPENAI_API_KEY

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
src/
├── app/              # Next.js 15 App Router pages
├── components/       # Reusable components
│   ├── forms/        # Forms and questionnaires
│   ├── results/      # Results display
│   ├── shared/       # Shared components
│   └── upload/       # Photo upload
├── services/         # Business logic
│   ├── ai/           # AI services
│   ├── affiliate/    # Product affiliation
│   └── educational/  # Educational interface
├── types/            # TypeScript types
└── utils/            # Utilities
```

## ✅ **Implementation Status**

### **🎉 Completed Features**
- ✅ 3-phase unified routine with intelligent transition
- ✅ Educational interface with personalized durations
- ✅ Optimized Vercel deployment (payload compression)
- ✅ Scientifically validated dermatological logic
- ✅ Consistent phase numbering (1,2,3...)
- ✅ Visual evolution criteria (vs arbitrary timing)
- ✅ Complete French to English translation
- ✅ Logic-safety comments for all French values

### **🔄 In Progress**
- User dashboard/history interface
- NextAuth.js authentication system
- Complete Supabase database

### **📈 Next Steps**
- Complete user testing
- AI prompt optimization for precise diagnosis
- Affiliate API integration (Sephora, Amazon)
- Feedback system and continuous improvement

## 🚀 Deployment

The application is optimized for Vercel deployment:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

**Environment Variables Required:**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📞 **Support & Documentation**

- **Technical documentation**: See [spec-english.md](./docs/spec-english.md)
- **Dermatological logic questions**: See [Dermatological_Logic_EN.md](./docs/Dermatological_Logic_EN.md)
- **Deployment issues**: Section 10 of [spec-english.md](./docs/spec-english.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**DermAI V2** - Transforming skincare through AI-powered personalized diagnosis.

*Built with ❤️ by the DermAI team*