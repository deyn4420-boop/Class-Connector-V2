# ClassConnect Frontend - Modern Upgrade Guide

## 🎯 What's New

Your ClassConnect app has been completely modernized with:

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for ultra-fast development and building
- **Tailwind CSS** for utility-first styling
- **Zustand** for lightweight state management
- **React Router** for seamless navigation
- **Lucide React** for beautiful icons
- **Axios** for API communication

### Features
✨ **Modern UI/UX**
- Gradient animations and smooth transitions
- Dark/Light theme toggle
- Responsive design (mobile-first)
- Beautiful loading states and skeletons

🔐 **TypeScript**
- Full type safety across the app
- Better IDE autocompletion
- Type-safe API responses

♿ **Accessibility (WCAG 2.1)**
- Semantic HTML
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Screen reader friendly

📱 **Responsive**
- Mobile-first design
- Adaptive sidebar navigation
- Touch-friendly buttons and inputs

🚀 **Performance**
- Code splitting with React Router
- Lazy loading components
- Optimized animations
- Minimal bundle size

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui.tsx              # Reusable UI components (Button, Card, etc.)
│   │   └── layout.tsx          # Layout components (Header, Sidebar)
│   ├── pages/
│   │   ├── Login.tsx           # Login page
│   │   ├── Register.tsx        # Registration page
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   └── Assignments.tsx
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces and types
│   ├── hooks/
│   │   └── index.ts            # Custom React hooks
│   ├── utils/
│   │   ├── api.ts              # Axios API client
│   │   └── store.ts            # Zustand stores (auth, theme, etc.)
│   ├── styles/
│   │   └── globals.css         # Global styles and animations
│   ├── App.tsx                 # Main app component with routing
│   └── main.tsx                # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── postcss.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (install from https://nodejs.org/)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure API endpoint** (edit `.env`):
```
VITE_API_URL=http://localhost:5000/api
```

3. **Start development server:**
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

4. **Build for production:**
```bash
npm run build
```
Output will be in `dist/frontend`

## 🎨 Key Components

### UI Components (`src/components/ui.tsx`)
- `Button` - Variants: primary, secondary, ghost
- `Card` - Container with gradient background
- `Input` - With label and error states
- `Textarea` - Multiline input
- `Select` - Dropdown select
- `Badge` - Status indicators
- `Stat` - Statistics display
- `Modal` - Dialog component
- `Skeleton` - Loading placeholder
- `Spinner` - Loading spinner

### Layout Components (`src/components/layout.tsx`)
- `Header` - Top navigation with theme toggle
- `Sidebar` - Navigation menu with responsive behavior

### Custom Hooks (`src/hooks/index.ts`)
- `useAsync` - Handle async data loading
- `useSession` - Get current user session
- `useForm` - Form handling with validation
- `useDebounce` - Debounce values

### Stores (`src/utils/store.ts`)
- `useTheme` - Dark/light mode toggle
- `useAuth` - Authentication state
- `useNotifications` - Notification management

### API Client (`src/utils/api.ts`)
```typescript
// Examples
await apiClient.login(email, password)
await apiClient.getStudentDashboard()
await apiClient.createAssignment(title, desc, deadline)
await apiClient.getNotifications()
```

## 🎨 Styling

### Theme Colors
The app uses a modern dark theme by default with customizable colors:
```css
--bg: #080d17           /* Main background */
--primary: #6366f1      /* Indigo primary */
--green: #10b981        /* Success color */
--amber: #f59e0b        /* Warning color */
--red: #ef4444          /* Error color */
```

### Tailwind Classes
All custom colors are available as Tailwind classes:
```tsx
<div className="bg-primary text-white border border-border">
  Primary box
</div>
```

## 🔄 Backend Integration

The Flask backend has been upgraded with a REST API:

### API Endpoints

**Authentication:**
- `POST /api/register` - Register new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/session` - Get current session

**Student Endpoints:**
- `GET /api/student/dashboard` - Dashboard data
- `GET /api/assignments` - Get assignments
- `GET /api/notes` - Get notes
- `GET /api/progress` - Get progress

**Teacher Endpoints:**
- `GET /api/teacher/dashboard` - Dashboard data
- `POST /api/assignments` - Create assignment
- `POST /api/notes` - Create note

## 📦 Environment Variables

`.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

### Type checking:
```bash
npm run type-check
```

### Linting:
```bash
npm run lint
```

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## ♿ Accessibility Features

- ✅ Semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ✅ ARIA labels and descriptions
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus visible states
- ✅ Color contrast compliance (WCAG AA)
- ✅ Screen reader support
- ✅ Loading states with `aria-busy`

## 🚀 Performance Tips

1. **Code Splitting** - Automatic with React Router
2. **Lazy Loading** - Use `React.lazy()` for components
3. **Images** - Use modern formats (WebP)
4. **Caching** - API responses cached where appropriate

## 🐛 Debugging

### Browser DevTools
- React DevTools extension recommended
- Check Console for errors
- Network tab for API calls

### VSCode Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin

## 📚 Learn More

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Docs](https://vitejs.dev/)
- [Zustand Docs](https://github.com/pmndrs/zustand)

## 💡 Best Practices

### Component Organization
```typescript
// Always use named exports
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>
}

// Use interface for props
interface MyComponentProps {
  prop1: string
  prop2?: number
}
```

### Form Handling
```typescript
const { values, errors, handleChange, handleSubmit } = useForm(
  { email: '', password: '' },
  async (values) => {
    await apiClient.login(values.email, values.password)
  }
)
```

### Async Data Fetching
```typescript
const { data, loading, error } = useAsync(() =>
  apiClient.getDashboard().then(res => res.data)
)
```

## 🤝 Contributing

When adding new components:
1. Place in `src/components/` or `src/pages/`
2. Add TypeScript interfaces
3. Include JSDoc comments
4. Use established color/spacing variables
5. Ensure accessibility compliance

## 📄 License

Same as ClassConnect main project

---

**Happy Coding! 🚀**
