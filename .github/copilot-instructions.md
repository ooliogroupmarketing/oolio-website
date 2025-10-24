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
export function Component({ fieldValues }) {
  const { richText, styles } = fieldValues;
  const backgroundColor = styles?.background?.color;
  return <Island module={ExampleIsland} richText={richText} backgroundColor={backgroundColor} />;
}
export const fields = (<ModuleFields>...</ModuleFields>);
export const meta = { label: 'Module Name' };

// Island (client-hydrated): /components/islands/*.tsx  
export default function ExampleIsland({ richText, backgroundColor }) {
  const backgroundStyle = backgroundColor ? {
    backgroundColor: backgroundColor.color,
    opacity: backgroundColor.opacity / 100
  } : {};
  return <div style={backgroundStyle} dangerouslySetInnerHTML={{ __html: richText }} />;
}
```

### HubL Template Integration
- **Templates**: `/templates/*.hubl.html` - Use `{% dnd_module path="../components/modules/ModuleName" %}`
- **Layouts**: `/templates/layouts/base.hubl.html` - Includes Alpine.js for HubL interactivity
- **Dual Interactivity**: Alpine.js for HubL modules, React for Islands

## Critical Development Patterns

### Module Registration
1. **React Modules**: Must export `Component`, `fields`, and `meta`
2. **HubL Modules**: Use `/hubl-modules/*/module.hubl.html` with Alpine.js and `x-data` directive
3. **Template Reference**: Use relative paths `../components/modules/ModuleName` in templates

### Field Structure & Access
```tsx
// Nested FieldGroups for organization
export const fields = (
  <ModuleFields>
    <RichTextField name="richText" label="Rich Text" />
    <FieldGroup name="styles" label="Styles" tab="STYLE">
      <FieldGroup name="background" label="Background">
        <ColorField name="color" label="Color" />
      </FieldGroup>
    </FieldGroup>
  </ModuleFields>
);

// Access nested fields: fieldValues.styles.background.color
```

### Rich Text Handling
```tsx
// React: Always use dangerouslySetInnerHTML for HubSpot rich text fields
<div dangerouslySetInnerHTML={{ __html: richText }} />

// HubL: Use rich_text filter for proper HTML rendering
{{ module.rich_text|rich_text }}
```

### Drag & Drop Areas with Layout
```html
{% dnd_area "area_name", label="Area Label" %}
  {% dnd_section %}
    {% dnd_module path="../components/modules/ModuleName" offset=0 width=6 %}
    {% dnd_module path="../hubl-modules/module-name.module" offset=6 width=6 %}
  {% end_dnd_section %}
{% end_dnd_area %}
```

### CSS Module Patterns
```tsx
// Islands can have local CSS modules in ./styles/ directory
import styles from './styles/example-island.module.css';

// Use .module.css extension for CSS modules, regular .css for global styles
// CSS modules provide scoped class names via styles.className
```

### Alpine.js Interactivity
```html
<!-- HubL modules use Alpine.js for client-side behavior -->
<div x-data>
  <button @click="alert('Alpine clicked!'); console.log('Alpine works!')">
    Click me
  </button>
</div>
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
- **Color Fields**: Return `{color: "#hex", opacity: 100}` objects for styling

## Troubleshooting
- **Module not rendering**: Verify path uses `../components/modules/ModuleName`
- **Islands not interactive**: Check React/react-dom versions and Island import syntax with `?island` suffix
- **CSS modules not working**: Ensure `.module.css` extension and proper relative import path
- **DnD layout errors**: Use `offset` and `width` parameters to prevent column overlap
- **Alpine.js not working**: Ensure `x-data` directive on parent element and proper event syntax
- **Field access errors**: Check nested path structure matches FieldGroup hierarchy
- **Build errors**: Run from root with `yarn start`, not theme directory