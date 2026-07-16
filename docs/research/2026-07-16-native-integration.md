# Native Integration Research

**Date:** 2026-07-16

**Decision:** Bizarre Industries uses one identity and integrates into a product's existing host system. It does not replace platform conventions or create product identities.

## Web and React

React defines a component model for user interfaces, not a visual design system. Its official documentation leaves styling to CSS and the product's chosen infrastructure. A React product must therefore preserve its actual component system, semantic HTML, browser behavior, and existing design tokens before a Bizarre layer is considered.

Primary sources:

- <https://react.dev/>
- <https://react.dev/learn#adding-styles>
- <https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/>

## Apple platforms

Apple's Human Interface Guidelines recommend interfaces that feel at home on each platform and use familiar system-defined components. SwiftUI controls adapt to platform context. Standard controls, navigation, system typography, input behavior, accessibility, window behavior, and platform motion remain the host layer.

Primary sources:

- <https://developer.apple.com/design/human-interface-guidelines/getting-started>
- <https://developer.apple.com/design/human-interface-guidelines/components/>
- <https://developer.apple.com/design/human-interface-guidelines/designing-for-ios/>
- <https://developer.apple.com/design/human-interface-guidelines/designing-for-macos/>
- <https://developer.apple.com/documentation/swiftui>
- <https://developer.apple.com/design/human-interface-guidelines/color>
- <https://developer.apple.com/design/human-interface-guidelines/typography>
- <https://developer.apple.com/design/human-interface-guidelines/motion>
- <https://developer.apple.com/documentation/swiftui/accessibility-fundamentals>

## Binding product rule

1. Host product and platform own behavior, navigation, controls, semantics, typography defaults, density, accessibility, input, and motion grammar.
2. Bizarre Industries owns one identity, Signal Lime's operational meaning, governed voice, composition, data visualization, and rare recognition moments.
3. Host convention wins any conflict.
4. Product-specific UI work begins with an audit of the actual implementation and component inventory.
5. Verification covers keyboard behavior, semantic HTML, platform focus, VoiceOver, Dynamic Type, Dark Mode, increased contrast, Reduce Motion, native input, and resizable-window behavior where applicable.
