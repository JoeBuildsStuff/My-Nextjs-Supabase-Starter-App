# Next.js Boilerplate with TailwindCSS, Shadcn/UI, and Supabase

## Overview
This project is a modern web application boilerplate built using:
- **Next.js 14**: A React framework for building server-rendered and static web applications.
- **TailwindCSS**: A utility-first CSS framework for styling.
- **Shadcn/UI**: A collection of pre-built UI components.
- **Supabase**: A Firebase alternative for authentication, database, and API management.

The boilerplate includes dark mode support, beautiful typography, and a streamlined authentication flow using magic links and OAuth.

---

## Features
### 1. **Base Setup**
- Next.js app created with the App Router using `pnpm create-next-app@latest`.
- Shadcn/UI components added with:
  ```sh
  pnpm dlx shadcn@latest init
  pnpm dlx shadcn@latest add --all
  ```

### 2. **Theming**
- Integrated dark mode using `next-themes`:
  - `ThemeProvider` for managing light/dark mode.
  - A mode toggle component with `lucide-react` icons.

### 3. **Typography**
- Added TailwindCSS Typography plugin for styling Markdown or CMS content:
  ```sh
  pnpm add -D @tailwindcss/typography
  ```
  - Configured `tailwind.config.js` to include the plugin.

### 4. **Authentication**
- Configured Supabase for:
  - OAuth login (e.g., Google, GitHub).
  - Magic link-based authentication.
  - Session handling and secure redirects.
- Removed traditional password-based authentication for simplicity and security.

### 5. **Custom Pages and Layouts**
- Workspace pages with a protected layout that redirects unauthenticated users to login.
- Example implementations for workspace, login, and settings pages.

### 6. **Table Components**
Three levels of table implementations are provided:
1. **Basic Table**
   - Simple table with headers, footers, and captions
   - Perfect for static data display
   - Includes basic styling and layout options

2. **Advanced Data Table**
   - Enhanced functionality for data management
   - Features:
     - Column sorting and filtering
     - Pagination controls
     - Row selection
     - Column visibility toggle
     - Basic row actions

3. **Complex Table**
   - Full-featured implementation for advanced data handling
   - Features:
     - Advanced filtering (multi-select, date range, status)
     - Advanced pagination
     - Faceted filters
     - Row actions with dropdown menus
     - Status and priority indicators
     - Data schema validation using Zod

### 7. **Additional Libraries and Utilities**
#### UI Libraries
- **Radix UI**: Includes components like Dialog, Tooltip, Accordion, and more (`@radix-ui/react-*`).
- **cmdk**: Command menu for React applications.

#### Utilities
- **clsx**: Utility for conditionally joining class names.
- **class-variance-authority**: TailwindCSS class variance management.
- **tailwind-merge**: Merges TailwindCSS class strings intelligently.

#### State Management and Validation
- **zod**: TypeScript-first schema declaration and validation.
- **react-hook-form**: Manage forms and input validation.
- **@hookform/resolvers**: Integrates Zod and other validation libraries with React Hook Form.

#### Carousel and Charts
- **embla-carousel-react**: Lightweight carousel/slider library.
- **recharts**: Charting library for React.

#### Date and Time
- **date-fns**: Modern JavaScript date utility library.
- **react-day-picker**: Date picker component for React.

#### OTP Handling
- **input-otp**: Create OTP input fields.

#### Notifications
- **sonner**: Lightweight React toast notification library.

#### Animations
- **tailwindcss-animate**: Predefined animations for TailwindCSS.

#### Supabase Utilities
- **@supabase/ssr**: Supabase support for server-side rendering.

---

## Getting Started
### Prerequisites
Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **pnpm**

### Installation
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Set up Supabase:
   - Create a Supabase project at [supabase.com](https://supabase.com/).
   - Add your Supabase credentials to `.env`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
     ```

4. Run the development server:
   ```sh
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure
```
/src
  |-- actions
  |    |-- auth.ts
  |    |-- user.ts
  |-- app
  |    |-- (Auth)
  |    |    |-- login
  |    |    |-- callback
  |    |-- (Workspace)
  |    |    |-- workspace
  |    |-- layout.tsx
  |    |-- page.tsx
  |-- components
  |    |-- ui
  |    |-- theme-provider.tsx
  |-- hooks
  |    |-- use-toast.ts
  |    |-- use-theme.ts
  |-- lib
  |    |-- utils.ts
  |    |-- constants.ts
  |-- styles
  |    |-- globals.css
  |-- types
  |    |-- index.d.ts
  |    |-- supabase.ts
  |-- utils
       |-- supabase
       |-- helpers
```

- **`actions`**: Server actions for handling form submissions and API calls.
- **`app`**: Application pages and layouts using Next.js App Router.
- **`components`**: Reusable UI components and Shadcn/UI components.
- **`hooks`**: Custom React hooks for state management and functionality.
- **`lib`**: Shared utilities, constants, and configuration.
- **`styles`**: Global CSS and Tailwind configuration.
- **`types`**: TypeScript type definitions and declarations.
- **`utils`**: Helper functions and service clients (e.g., Supabase).

---

## Commands
- `pnpm dev`: Start the development server.
- `pnpm build`: Build the application for production.
- `pnpm start`: Start the production server.
- `pnpm lint`: Run ESLint to check for linting issues.

---

## Roadmap

- Implement form page templates
- Implement profile page templates
- Implement table page templates
---

## Contributing
Contributions are welcome! Feel free to fork the repository and submit a pull request.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

