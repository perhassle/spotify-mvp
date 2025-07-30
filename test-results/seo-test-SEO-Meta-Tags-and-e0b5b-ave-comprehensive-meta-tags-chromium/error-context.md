# Page snapshot

```yaml
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- link "Next.js 15.4.4 (stale) Webpack":
  - /url: https://nextjs.org/docs/messages/version-staleness
  - img
  - text: Next.js 15.4.4 (stale) Webpack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Stack Trace":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - link "Learn more about enabling Node.js inspector for server code with Chrome DevTools":
    - /url: https://nextjs.org/docs/app/building-your-application/configuring/debugging#server-side-code
    - img
  - paragraph: "x Unexpected token. Did you mean `{'}'}` or `&rbrace;`?"
  - img
  - text: ./src/components/audio/complete-audio-player.tsx
  - button "Open in editor":
    - img
  - text: "Error: x Unexpected token. Did you mean `{'}'}` or `&rbrace;`? ,-[/Users/perhassle/source/poc/AI/spotify-mvp/src/components/audio/complete-audio-player.tsx:217:1] 214 | </div> 215 | </div> 216 | ); 217 | } : ^ `---- x Unexpected eof ,-[/Users/perhassle/source/poc/AI/spotify-mvp/src/components/audio/complete-audio-player.tsx:217:1] 214 | </div> 215 | </div> 216 | ); 217 | } `---- Caused by: Syntax Error"
- alert
```