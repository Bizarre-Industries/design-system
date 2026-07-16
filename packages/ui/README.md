# @bizarre/ui

`@bizarre/ui` is Bizarre Industries' opt-in HTML/CSS styling and state adapter. It wraps existing semantic HTML or host-framework primitives; it does not ship component behavior, a component runtime, a global reset, or a cross-platform visual system.

The browser and host application remain responsible for focus management, keyboard behavior, routing, forms, dialogs, validation, announcements, application state, typography defaults, and root surfaces. Consumers audit their existing component system first, then apply `data-bzr-component`, `data-state`, native attributes, and ARIA states only to selected existing accessible elements. Load the canonical token package before these styles.

The governing principle is `integrate-not-replace`. Bizarre Industries is the only identity. Products keep their existing design system and platform conventions, then apply a restrained Bizarre recognition layer. React does not define a visual language; a React product keeps its actual component system, semantic HTML, and browser behavior. This web adapter is not used to skin SwiftUI. Apple products keep SwiftUI and native iOS or macOS controls, navigation, typography, accessibility, density, input behavior, and motion.

```html
<link rel="stylesheet" href="@bizarre/tokens/tokens.css">
<link rel="stylesheet" href="@bizarre/ui/components.css">
<link rel="stylesheet" href="@bizarre/ui/motion.css">
<link rel="stylesheet" href="@bizarre/ui/rtl.css">

<button data-bzr-component="signal-action" data-variant="primary">
  Capture
</button>
```

Signal Lime is state-bearing, not decorative. Use it only for active, selected, ready, captured, synchronized, aligned, live, or current-path meaning. The five theme values live on `data-bizarre-theme` at an ancestor. Use native `disabled`, `aria-pressed`, and `aria-busy` semantics; do not represent those states with CSS alone.

The complete state, motion, direction, and infrastructure boundary is published as `@bizarre/ui/contract.json`.
