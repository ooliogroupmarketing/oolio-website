# GitHub Copilot Instructions

## Project Overview
This is a **HubSpot CMS theme project** using a hybrid architecture: HubL templates for server-side rendering with React Islands for client-side interactivity. Uses `yarpm` for nested package management and HubSpot's local dev server.

## Quick Start
- **Install dependencies (root):** `yarn install` (or `npm install` / `pnpm install`)
- **Start dev server (root):** `yarn start` — this delegates to the theme-level dev server (`hs-cms-dev-server`) and runs the local HubSpot dev environment with SSL.
- **Build / Deploy:** `yarn deploy` (uploads via `hs project upload`) — run this from the project root unless noted otherwise.
- **Notes:** Always run the dev server and deploy commands from the repository root so `yarpm` can properly delegate to `src/theme/my-theme`.

## Current Interaction Patterns & Constraints
- **No Tailwind**: Use plain CSS; do not add Tailwind utility classes.
- **Alpine x-collapse**: Accordions and similar height transitions should use Alpine's `x-collapse` (loaded globally) instead of bespoke JS height logic.
- **Plus/Minus toggles**: Accordions and header mega-menu triggers swap plus→minus via `x-show` bound to the open state.
- **Header nav**: Mega menus are controlled by `megaMenu1Open`/`megaMenu2Open`; header state (`headerHidden`, `headerScrolled`) is driven by scroll listeners. Keep existing Alpine state names when extending.
- **Logos slider**: Uses CSS-only marquee with duplicated logo set in the markup for seamless looping; speed is controlled via CSS variables (`--logo-count`, `--logo-width`, `--logo-gap`) set in HubL. Slider breaks out to full viewport width via `width: 100vw` and `margin-left: calc(-50vw + 50%)`.

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
- **Advanced State Management**: Use complex inline `x-data` with init() functions for scroll behavior, header state management
- **Scroll-Responsive Header**: Header hides/shows based on scroll direction with `headerHidden`, `headerTop`, `lastScrollY` state
- **Mega Menu System**: Desktop mega menus with `x-show="megaMenu1Open && !headerHidden"` and Alpine transitions
- **Mobile Menu**: Full-screen overlay with scroll position preservation using `x-effect` for body scroll locking
- **CSS Custom Properties**: Use `:root` variables for breakpoints with media query comments for maintainability

## Critical Development Patterns

### Advanced Alpine.js Navigation Patterns
```html
<!-- Complex state management with scroll integration -->
<nav x-data="{
  mobileMenuOpen: false, megaMenu1Open: false, headerHidden: false, headerScrolled: false,
  lastScrollY: 0, scrollPosition: 0,
  init() { 
    window.addEventListener('scroll', () => {
      // Header visibility logic based on scroll direction and position
      const currentScrollY = window.scrollY;
      this.headerScrolled = currentScrollY > 220;
      if (!this.mobileMenuOpen) {
        this.headerHidden = currentScrollY > 100 && currentScrollY > this.lastScrollY;
      }
      this.lastScrollY = currentScrollY;
    });
  }
}"
x-effect="
  $el.closest('.header').classList.toggle('header--hidden', headerHidden);
  $el.closest('.header').classList.toggle('header--scrolled', headerScrolled);
  $el.closest('.header').classList.toggle('header--menu-open', megaMenu1Open || megaMenu2Open);
">
```

### Mobile Menu with Scroll Preservation
```html
<!-- Mobile menu with body scroll locking and position preservation -->
<div x-show="mobileMenuOpen" x-cloak
  x-effect="
    if (mobileMenuOpen) {
      scrollPosition = window.scrollY;
      document.body.style.top = `-${scrollPosition}px`;
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollPosition);
    }
  ">
```

### CSS Architecture Patterns
```css
/* CSS Custom Properties for maintainable breakpoints */
:root {
  --breakpoint-mobile: 468px;
  --breakpoint-tablet: 768px;
}

@media (max-width: 468px) { /* var(--breakpoint-mobile) */
  .mobile-menu__actions a:not(:first-child) { display: none; }
}

/* Alpine transition classes for smooth animations (0.2s timing) */
.menu--enter { transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out; }
.menu--enter-start { opacity: 0; transform: translateY(-10px); }
.menu--enter-end { opacity: 1; transform: translateY(0); }
.mega-menu-enter { transition: opacity 0.2s ease-out, transform 0.2s ease-out; }

/* Gradient overlays with pseudo-elements for scroll indicators */
.mobile-menu::before {
  background: linear-gradient(to bottom, #222 0%, #222 50%, transparent 100%);
  pointer-events: none;
}

/* Grid layouts with aspect-ratio for square cells */
.boxes__grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 30px;
  aspect-ratio: 1 / 1;
}
```

### Module Registration & Modern Patterns
1. **React Modules**: Export `Component`, `fields`, `meta`, plus optional `hublDataTemplate` for theme variables
2. **HubL Modules**: Use complex Alpine.js with inline `x-data` objects for navigation, forms, and interactive UI
3. **Field Groups**: Nested repeatable groups with `occurrence: {min: 1, max: 6}` for modular content like footer navigation menus
4. **Reusable Macros**: Define button macros with link type handling (external, phone, email) and proper escaping

### HubL Module Patterns
```hubl
{# Reusable button macro with link type handling #}
{% macro buttons(items, button1_style, button2_style) %}
  {% macro render_button(item) %}
    {% set href = item.button_link.url.href %}
    {% if item.button_link.url.type == "PHONE_NUMBER" %}
      {% set href = "tel:" + href %}
    {% elif item.button_link.url.type == "EMAIL_ADDRESS" %}
      {% set href = "mailto:" + href %}
    {% elif item.button_link.url.type == "EXTERNAL" and not href is string_startingwith("tel:") %}
      {% set href = href|escape_url %}
    {% endif %}
    <a class="button {{ button1_style if loop.index == 1 else button2_style }}" 
       href="{{ href }}"
       {% if item.button_link.open_in_new_tab %}target="_blank"{% endif %}>
      <span>{{ item.button_text }}</span>
    </a>
  {% endmacro %}
  {% for item in items %}{{ render_button(item) }}{% endfor %}
{% endmacro %}

{# Conditional styling based on module fields #}
{% require_css %}
  <style>
    {% scope_css %}
      {% if module.style.quote.quote_gradient_background %}
        .box__review {
          background: {{ module.style.quote.quote_gradient_background.css }};
        }
      {% endif %}
    {% end_scope_css %}
  </style>
{% end_require_css %}

{# Dynamic class assignment based on field values #}
{% set alignment_class = "boxes--grid-left" %}
{% if module.style.boxes.boxes_alignment.horizontal_align == "RIGHT" %}
  {% set alignment_class = "boxes--grid-right" %}
{% elif module.style.boxes.boxes_alignment.horizontal_align == "CENTER" %}
  {% set alignment_class = "boxes--grid-center" %}
{% endif %}
<div class="boxes {{ alignment_class }}">
```

### Background Video Pattern
```hubl
{# Video with poster fallback (no pseudo-elements on video tags) #}
<div class="hero">
  <video class="hero__bg-video" autoplay muted loop playsinline 
         aria-hidden="true" poster="{{ poster_url }}">
    <source src="{{ video_url }}" type="video/mp4">
  </video>
  <div class="hero__bg-overlay"></div> {# Separate overlay element #}
  <div class="hero__container"><!-- content --></div>
</div>
```

```css
.hero__bg-video {
  position: absolute;
  inset: 0;
  object-fit: cover;
  z-index: 0;
}
.hero__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(34, 34, 34, 0.5) 0%, transparent 100%);
  z-index: 1;
}
.hero__container {
  position: relative;
  z-index: 2;
}
```

### Schema.org Structured Data for Reviews
```html
<div itemscope itemtype="https://schema.org/Review">
  <blockquote itemprop="reviewBody">
    <p>"Quick, efficient, positive, patient and solved my problem"</p>
  </blockquote>
  <footer>
    <cite>
      <span itemprop="author" itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">George Khoury</span>,
        <span itemprop="affiliation" itemscope itemtype="https://schema.org/Organization">
          <span itemprop="name">Oasis</span>
        </span>
      </span>
    </cite>
  </footer>
</div>
```

### HubSpot Field Configuration Best Practices
```json
// Repeatable groups for scalable content (navigation menus)
{
  "name": "navigation_menus", "type": "group", "occurrence": {"min": 1, "max": 6},
  "children": [
    {"name": "nav_title", "type": "text"},
    {"name": "nav_links", "type": "group", "occurrence": {"min": 0, "max": 10}, 
     "children": [{"name": "link_text", "type": "text"}, {"name": "link_url", "type": "url"}]}
  ]
}

// Background video fields with enable toggle
{
  "name": "background_video", "type": "group", "children": [
    {"name": "enable", "type": "boolean", "default": false},
    {"name": "mp4", "type": "file", "picker": "file"},
    {"name": "webm", "type": "file", "picker": "file"},
    {"name": "poster", "type": "image", "picker": "image"}
  ]
}

// Avoid deep nesting - HubSpot limits to 3-4 levels of nested groups
// Use inherited_value for theme consistency
{
  "inherited_value": {
    "property_value_paths": {
      "color": "theme.global_colors.primary.color"
    }
  }
}
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

## Advanced Integration Patterns

### DnD Template Architecture
```hubl
{% dnd_area "main_dnd_area", label="Main Content Area", class="body-container" %}
  {% dnd_section padding={"default": {"top": "0px", "bottom": "0px"}}, full_width=true %}
    {% dnd_column offset=0, width=12 %}  {# 12-column grid, offset + width must = 12 #}
      {% dnd_row %}
        {# React modules use relative path from templates/ #}
        {% dnd_module path="../components/modules/ExampleReact", offset=0, width=12 %}
        {% end_dnd_module %}
        {# HubL modules reference hubl-modules/ #}
        {% dnd_module path="../hubl-modules/hero", offset=0, width=12 %}
        {% end_dnd_module %}
      {% end_dnd_row %}
    {% end_dnd_column %}
  {% end_dnd_section %}
{% end_dnd_area %}
```

### Alpine.js Component Architecture
```html
<!-- Complex state with multiple coordinated behaviors -->
<div x-data="{
  megaMenu1Open: false, megaMenu2Open: false,
  init() { /* scroll management logic */ }
}"
x-effect="/* DOM class management */">
  
  <!-- Mega menu with conditional visibility and transitions -->
  <div x-show="megaMenu1Open && !headerHidden" 
       x-transition:enter="menu--enter"
       x-transition:leave="menu--leave"
       @click.away="megaMenu1Open = false">
</div>
```

### Responsive Design Patterns
```css
/* Mobile-first responsive design with component visibility control */
@media (max-width: 468px) { /* var(--breakpoint-mobile) */
  .mobile-menu__actions a:not(:first-child) { display: none; }
  .mobile-menu__actions a { min-width: 100%; }
}

@media (min-width: 768px) { /* var(--breakpoint-tablet) */
  .header-nav__menu { display: flex; }
  .header-nav__actions { display: flex; }
}
```

## Integration Points
- **Alpine.js**: Loaded in `base.hubl.html` with focus, collapse, and intersect plugins for advanced navigation
- **CSS Modules**: Import as `styles from './styles/file.module.css'` (local) or `'../../styles/file.module.css'` (global)
- **Asset References**: Use `{{ get_asset_url('../../assets/path') }}` in HubL templates, direct imports in React
- **Module Paths**: React modules use `../components/modules/ModuleName`, HubL modules use `../hubl-modules/module-name`
- **Field Access**: `fieldValues.styles.background.color` in React, `module.styles.background.color` in HubL
- **Color Fields**: Return objects with color and opacity properties for styling

## Troubleshooting
- **Module not rendering**: Verify path uses `../components/modules/ModuleName`
- **Islands not interactive**: Check React/react-dom versions and Island import syntax with `?island` suffix
- **CSS modules not working**: Ensure `.module.css` extension and proper relative import path
- **DnD layout errors**: Use `offset` and `width` parameters to prevent column overlap
- **Alpine.js not working**: Ensure `x-data` directive on parent element and proper event syntax
- **Field validation errors**: Avoid deep nesting (max 3-4 group levels), check inherited_value paths
- **Mobile menu overflow**: Use `min-height: 0` and `flex: 1` for proper flex shrinking and scroll containment
- **Video pseudo-elements**: Video tags don't support `::before` or `::after` - use wrapper divs
- **Asset URL errors**: Use `get_asset_url()` instead of `asset_url()` in HubL
- **Grid aspect ratio**: Apply `aspect-ratio: 1 / 1` to grid container, not individual items
- **Build errors**: Run from root with `yarn start`, not theme directory