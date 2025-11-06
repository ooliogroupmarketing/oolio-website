# GitHub Copilot Instructions

## Project Overview
This is a **HubSpot CMS theme project** using a hybrid architecture: HubL templates for server-side rendering with React Islands for client-side interactivity. Uses `yarpm` for nested package management and HubSpot's local dev server.

## Key Architecture Patterns

### Dual Build System
- **Root level**: Uses `yarpm` to manage nested theme dependencies (`package.json` → `src/theme/my-theme/package.json`)
- **Theme level**: Contains actual HubSpot theme with React components and HubL templates
- **Commands**: Always run `yarn start` from root (delegates to theme-level `hs-cms-dev-server`)

### React Islands Pattern
```tsx
// Module (server-rendered): /components/modules/*/index.tsx
export const hublDataTemplate = `{% set hublData = { "themePrimaryColor": theme.global_colors.primary } %}`;
export function Component({ fieldValues, hublData }) {
  const { richText, styles } = fieldValues;
  return <Island module={ExampleIsland} richText={richText} backgroundColor={styles?.background?.color} themePrimaryColor={hublData?.themePrimaryColor} />;
}
export const fields = (<ModuleFields>...</ModuleFields>);
export const meta = { label: 'Module Name' };

// Island (client-hydrated): /components/islands/*.tsx with ?island suffix  
export default function ExampleIsland({ richText, backgroundColor, themePrimaryColor }) {
  // Parse theme variables (they come as JSON strings)
  const parsedThemeColor = typeof themePrimaryColor === 'string' ? JSON.parse(themePrimaryColor) : themePrimaryColor;
  return <div style={backgroundStyle} dangerouslySetInnerHTML={{ __html: richText }} />;
}
```

### Alpine.js Navigation Architecture
- **Complex state management**: Use inline `x-data` with init() functions for scroll behavior
- **Mega menu patterns**: `x-show="mobileMenuOpen && !headerHidden"` with `x-transition` classes
- **Mobile menu integration**: Body scroll locking with `x-effect="document.body.classList.toggle('menu-open', mobileMenuOpen)"`

## Critical Development Patterns

### Module Registration & Modern Patterns
1. **React Modules**: Export `Component`, `fields`, `meta`, plus optional `hublDataTemplate` for theme variables
2. **HubL Modules**: Use complex Alpine.js with inline `x-data` objects for navigation, forms, and interactive UI
3. **Field Groups**: Nested repeatable groups with `occurrence: {min: 1, max: 6}` for modular content like footer navigation menus

### Advanced Field Patterns
```json
// Repeatable groups for scalable content (footer-nav.module/fields.json)
{
  "name": "navigation_menus", "type": "group", "occurrence": {"min": 1, "max": 6},
  "children": [
    {"name": "nav_title", "type": "text"},
    {"name": "nav_links", "type": "group", "occurrence": {"min": 0, "max": 10}, 
     "children": [{"name": "link_text", "type": "text"}, {"name": "link_url", "type": "url"}]}
  ]
}
```

### Alpine.js Component Architecture
```html
<!-- Advanced state management with scroll integration -->
<nav x-data="{
  mobileMenuOpen: false, megaMenu1Open: false, headerHidden: false, lastScrollY: 0,
  init() { window.addEventListener('scroll', () => { /* complex scroll logic */ }); }
}" x-effect="$el.closest('.header').classList.toggle('header--hidden', headerHidden)">
  <!-- Mega menus with conditions and transitions -->
  <div x-show="megaMenu1Open && !headerHidden" 
       x-transition:enter="mega-menu-enter" x-transition:leave="mega-menu-leave">
</nav>
```

### CSS Transition Classes (not Tailwind)
```css
/* Custom Alpine.js transitions for mega menus */
.mega-menu-enter { transition: opacity 200ms ease-out, transform 200ms ease-out; }
.mega-menu-enter-start { opacity: 0; transform: translateY(-10px); }
.mega-menu-leave-end { opacity: 0; transform: translateY(-10px); }
```

## Development Workflow

### Commands (run from root)
- **Start dev server**: `yarn start` (runs `hs-cms-dev-server` with SSL)
- **Deploy**: `yarn deploy` (uploads via `hs project upload`)
- **Install dependencies**: `yarn install` (auto-runs postinstall for theme)

### Dependency Management
- **React versions**: Keep `react@^18.1.0` and `react-dom` aligned 
- **Vite plugin**: Use `@vitejs/plugin-react@^4.7.0` (matches HubSpot dev server)
- **Conflicts**: Use `--legacy-peer-deps` for HubSpot compatibility

### File Organization
```
src/theme/my-theme/
├── components/
│   ├── modules/     # Server-rendered React modules with fields
│   └── islands/     # Client-hydrated React components + local styles/
├── hubl-modules/    # Traditional HubL modules with Alpine.js
├── templates/       # HubL page templates and layouts/
├── assets/          # Static assets (CSS, JS, images)
└── styles/          # Global CSS modules
```

## Integration Points
- **Alpine.js**: Loaded in `base.hubl.html` for HubL module interactivity
- **CSS Modules**: Import as `styles from './styles/file.module.css'` (local) or `'../../styles/file.module.css'` (global)
- **Asset References**: Use `{{ asset_url('path') }}` in HubL, direct imports in React
- **Field Access**: `fieldValues.styles.background.color` in React, `module.styles.background.color` in HubL
- **Color Fields**: Return objects with color and opacity properties for styling

## Troubleshooting
- **Module not rendering**: Verify path uses `../components/modules/ModuleName`
- **Islands not interactive**: Check React/react-dom versions and Island import syntax with `?island` suffix
- **CSS modules not working**: Ensure `.module.css` extension and proper relative import path
- **DnD layout errors**: Use `offset` and `width` parameters to prevent column overlap
- **Alpine.js not working**: Ensure `x-data` directive on parent element and proper event syntax
- **Field access errors**: Check nested path structure matches FieldGroup hierarchy
- **Build errors**: Run from root with `yarn start`, not theme directory