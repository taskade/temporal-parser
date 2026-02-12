---
"@taskade/temporal-parser": minor
---

Add `parseTimeString` function for parsing standalone time strings in multiple formats (12h/24h, AM/PM, locale variations). Returns `TimeAst` compatible with Temporal.PlainTime. Handles common LLM-generated time formats like "09:00" alongside locale formats like "9:07 AM". Features LLM-friendly error messages with examples and suggestions.
