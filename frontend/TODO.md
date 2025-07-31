# Frontend TODO - BookmarkParser

## High Priority
- [ ] **Test UI API key editing functionality** - Ensure the API key configuration interface works properly
- [ ] **Implement bookmark selection checkboxes** - Add selection UI to BookmarkTree.tsx for choosing bookmarks to process
- [ ] **Build AI provider configuration UI** - Complete SettingsPage.tsx for Claude/OpenAI API key setup

## Medium Priority
- [ ] **Add processing queue visualization** - Show batch processing status and progress
- [ ] **Implement export functionality UI** - Download interface for cleaned bookmark files
- [ ] **Add WebSocket integration** - Real-time updates for processing status
- [ ] **Delete Functions** - Delete functions do not work.

## Testing Gaps
- [ ] **API Key Validation Flow** - Test invalid keys, network errors, success states
- [ ] **Bookmark Selection State** - Test selection/deselection across tree navigation
- [ ] **Expert Mode UI** - Verify modal displays correctly with real analysis data

## Component Improvements
- [ ] **BookmarkTree selection state** - Add useSelection hook integration
- [ ] **Error boundary testing** - Ensure graceful failure for component errors
- [ ] **Mobile responsiveness** - Test on various screen sizes

## UI/UX Enhancements
- [ ] **Loading states** - Add spinners for all async operations
- [ ] **Toast notifications** - Standardize success/error messaging
- [ ] **Accessibility audit** - Keyboard navigation and screen reader support

---
*Last Updated: July 31, 2025*