# Backend TODO - BookmarkParser

## High Priority
- [ ] **Fix expert mode JSON parsing error** - Handle empty strings in database JSON fields (routes/expert.ts:57,64,65,66)
- [ ] **Test OpenAI provider end-to-end** - Validate OpenAIProvider.ts works with real API calls
- [ ] **Add API key validation endpoints** - Test invalid keys, network errors, rate limits in routes/ai.ts

## Medium Priority  
- [ ] **Implement job queue system** - Bull with Redis for async AI processing
- [ ] **Add WebSocket support** - Real-time updates for processing status
- [ ] **Complete export service** - Generate cleaned bookmark HTML files

## Testing Gaps
- [ ] **OpenAI Provider Testing** - Unit and integration tests for ai/providers/OpenAIProvider.ts
- [ ] **Expert route error handling** - Test with malformed JSON data in database
- [ ] **Rate limiting validation** - Ensure AI provider rate limits work correctly

## Bug Fixes
- [ ] **Database JSON field handling** - Prevent empty strings from being stored as JSON fields
- [ ] **Error response standardization** - Consistent error format across all routes

---
*Last Updated: July 31, 2025*