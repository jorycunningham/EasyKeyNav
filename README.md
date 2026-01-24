# EasyKeyNav

A Chrome extension for enhanced keyboard navigation, built with accessibility as a core principle.

## Features

- **Heading Navigation**: Cycle through all headings with `h` and `Shift+H` keys
- **Landmark Navigation**: Navigate ARIA landmarks with `l` and `Shift+L` keys
- **Skip Links**: Quickly navigate to main content, headings, and navigation
- **Keyboard Shortcuts**: Accessible shortcuts that don't conflict with screen readers
- **WCAG 2.2 AA Compliant**: Meets Level AA accessibility standards
- **Screen Reader Support**: Full compatibility with NVDA, JAWS, and VoiceOver
- **User Preference Support**: Respects reduced motion, dark mode, and high contrast settings
- **Toggle On/Off**: Easy enable/disable via extension popup

## Installation

### From Source (Development)

1. Clone or download this repository
2. Add your icon files (16x16, 48x48, 128x128 PNG) to the `icons/` folder
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top-right corner)
5. Click "Load unpacked"
6. Select the `EasyKeyNav` folder

### From Chrome Web Store

*Coming soon*

## Usage

### Keyboard Shortcuts

All shortcuts work on **Windows, Mac, and Linux**.

| Windows / Linux | Mac | Action |
|----------------|-----|--------|
| `h` | `h` | Navigate to next heading (cycles through all headings) |
| `Shift+H` | `Shift+H` | Navigate to previous heading |
| `l` | `l` | Navigate to next landmark (banner, nav, main, etc.) |
| `Shift+L` | `Shift+L` | Navigate to previous landmark |
| `Alt+Shift+M` | `Option+Shift+M` | Skip to main content |
| `Alt+Shift+H` | `Option+Shift+H` | Go to main heading (h1) |
| `Alt+Shift+N` | `Option+Shift+N` | Go to navigation |
| `Ctrl+/` | `Cmd+/` | Toggle keyboard shortcuts help dialog |
| `Escape` | `Escape` | Close help dialog |
| `Tab` | `Tab` | Focus skip link (on first Tab press) |

**Note for Mac users:** The `Alt` key on Windows/Linux is the `Option` (⌥) key on Mac, and `Ctrl` is `Command` (⌘).

### Extension Popup

Click the extension icon to:
- Enable/disable keyboard navigation
- View current status

## Accessibility

This extension follows **WCAG 2.2 Level AA** standards and includes:

- ✅ Full keyboard navigation support
- ✅ Screen reader compatibility
- ✅ High color contrast ratios (4.5:1 minimum)
- ✅ Focus indicators meeting WCAG 2.4.7
- ✅ Support for reduced motion preferences
- ✅ Dark mode and high contrast mode support
- ✅ No keyboard traps or conflicts with assistive technology

For detailed accessibility information, see [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Development

### Project Structure

```
EasyKeyNav/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles (WCAG compliant)
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for keyboard navigation
├── icons/                # Extension icons
├── ACCESSIBILITY.md      # Accessibility documentation
├── README.md            # This file
└── .gitignore           # Git ignore rules
```

### Adding Custom Shortcuts

When adding new keyboard shortcuts to [content.js](content.js):

1. **Always use `Alt+Shift` modifier** to avoid conflicts
2. **Never override**: Tab, Enter, Space, Escape, Arrow keys
3. **Check against screen reader shortcuts** (see ACCESSIBILITY.md)
4. **Test with keyboard only** before committing
5. **Document in UI and README**

Example:
```javascript
// Good: Uses Alt+Shift modifier
if (event.key === 'F' && event.altKey && event.shiftKey) {
  event.preventDefault();
  // Your code here
}

// Bad: Conflicts with native browser shortcuts
if (event.key === 'f' && event.ctrlKey) {
  // This conflicts with Ctrl+F (Find)
}
```

### Testing

#### Manual Testing
- Test with keyboard only (unplug mouse)
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Test at 200% zoom
- Test in dark mode
- Test with reduced motion enabled

#### Cross-Platform Testing
- Test on Windows (Alt key shortcuts)
- Test on macOS (Option key shortcuts)
- Test on Linux (Alt key shortcuts)
- Verify all shortcuts work on each platform
- Check that skip links show correct key names

#### Automated Testing
- [axe DevTools](https://www.deque.com/axe/devtools/): Run accessibility audit
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/): Check accessibility score
- [WAVE](https://wave.webaim.org/): Scan for issues

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for complete testing checklist.

## Browser Support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Contributing

Contributions are welcome! Please ensure all contributions:

1. Follow WCAG 2.2 Level AA standards
2. Pass accessibility audits (axe, Lighthouse)
3. Work with keyboard navigation only

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for detailed guidelines.

## License

MIT License - feel free to use this project as a template for your own accessible Chrome extensions.

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Chrome Extension Accessibility](https://developer.chrome.com/docs/extensions/mv3/a11y/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Acknowledgments

Built with accessibility in mind, following best practices from:
- Web Content Accessibility Guidelines (WCAG) 2.2
- ARIA Authoring Practices Guide (APG)
- Chrome Extension Accessibility Guidelines

## About the Creator
This extension was built by [Jory Cunningham](https://www.linkedin.com/in/jorycunningham/) in my spare time and is not endorsed by or realted to my employer. I built this using my professional knowledge of accessibility, but with the humility of not having the personal lived experience of relying on a keyboard alone to navigate the web.
