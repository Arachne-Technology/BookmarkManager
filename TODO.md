# BookmarkParser - Immediate Action Items

## High Priority (Critical)
- [ ] **Test OpenAI provider integration and functionality** - We have built the OpenAI provider but haven't validated it works end-to-end
- [ ] **Test UI API key editing functionality** - Ensure the API key configuration interface works properly
- [ ] **Fix expert mode JSON parsing error** - Database contains empty strings causing JSON.parse crashes

## Medium Priority (Soon)
- [ ] **Implement bookmark selection checkboxes in tree view** - Add selection UI for choosing bookmarks to process
- [ ] **Build AI provider configuration UI interface** - Frontend for setting up Claude/OpenAI API keys
- [ ] **Add processing queue management system** - Rate limiting and batch processing interface

## Testing Gaps
- [ ] **OpenAI End-to-End Test** - Upload bookmarks → Configure OpenAI → Process → Verify results
- [ ] **API Key Validation** - Test invalid keys, network errors, rate limits
- [ ] **Expert Mode Data Flow** - Verify all JSON fields parse correctly with real data

## Bug Fixes
- [ ] **Expert Mode JSON Error** - Handle empty strings in database JSON fields (extraction_metadata, ai_quality_issues, ai_request_data, ai_response_data)

## Documentation Updates Needed
- [ ] Update MVP-PLAN.md with testing status once OpenAI testing complete
- [ ] Add troubleshooting section for common API key issues

---
*Last Updated: July 31, 2025*