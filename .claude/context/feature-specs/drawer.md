# Feature Spec: Bottom Drawer (Tools + Calls)

**Feature ID:** drawer
**Surface area:** Bottom edge of contractor chat screen — peek bar with 4 favorite tiles above input row, swipe up to reveal full drawer with Favorites grid, All Tools 4-col grid, and Today's Calls list
**Last updated:** 2026-05-27
**Spec owner:** Brandon
**Implementation file(s):** public/index.html — drawer markup, CSS, gesture handlers (TBD precise line range, explorer agent to locate)

---

## What this feature does

The drawer is the tech's tool drawer in their truck — but on their phone. Closed by default, it shows a thin peek bar with 4 favorite tools above the chat input. Swipe up and it slides into a full drawer showing all available Mike tools and the day's call list. Tap a tool tile to launch that tool. Tap a call to load that job's context into chat. Swipe down to close.

The drawer should feel like an actual Snap-On tool drawer — smooth, weighted, satisfying. It should not feel like a web modal or a JavaScript animation. Every motion has intent.

---

## The user journey

1. Tech opens contractor chat. Drawer is closed. Peek bar visible at bottom showing 4 favorite tool tiles above the chat input row.
2. Tech wants to launch a tool not in their favorites. Places finger on the peek bar and swipes up.
3. Drawer slides up smoothly, settling at full-open position (~75% screen height).
4. Tech sees three sections: Favorites (4 colorful tiles, Whoop-style), All Tools (4-column grid), Today's Calls (numbered list 01/02/03 with color-coded edges).
5. Tech taps a tool tile. Drawer closes (slides down smoothly), tool launches in chat.
6. OR: tech taps a call entry. Drawer closes, that job's context is loaded into chat.
7. OR: tech changes their mind. Swipes drawer down. Drawer closes smoothly back to peek-bar state.

---

## Every state this feature has

- **Closed (default):** peek bar visible at bottom, 4 favorite tiles, chat input row above. ~8% screen height total.
- **Opening (dragging up):** drawer follows finger position in real-time during swipe. Smooth interpolation, no jank.
- **Open:** drawer at ~75% screen height. Three sections visible. Backdrop behind drawer slightly dimmed.
- **Closing (dragging down):** drawer follows finger position during swipe-down.
- **Mid-gesture velocity decision:** if user releases mid-swipe, drawer snaps to nearest state (open or closed) based on velocity direction and position threshold (~50% line).
- **Empty Today's Calls:** when no calls assigned, this section shows Mike's empty-state message, not blank space.
- **Empty Favorites:** if user hasn't favorited any tools, the 4 peek tiles show default suggested favorites.

---

## What "working" means (the assertions)

- [ ] Peek bar is visible on contractor chat by default (not hidden, not collapsed)
- [ ] Peek bar shows exactly 4 favorite tool tiles
- [ ] Chat input row sits ABOVE the peek bar, not behind it
- [ ] Swipe up on peek bar opens the drawer
- [ ] Swipe down on open drawer closes it
- [ ] Drawer motion follows finger position in real time (no fixed animation that ignores gesture velocity)
- [ ] Drawer settles cleanly at open or closed position, never stuck halfway
- [ ] Tapping a tool tile launches that tool and closes the drawer
- [ ] Tapping a call entry loads that job's context and closes the drawer
- [ ] All animations are smooth at 60fps on iPhone Safari
- [ ] Drawer respects iOS safe-area-inset-bottom (doesn't get hidden under home indicator)
- [ ] Backdrop is dimmed when drawer is open, restored when closed
- [ ] Drawer does not block chat input when closed
- [ ] Drawer does not interfere with PTT button (which sits in the chat header, separate surface)

---

## Known gotchas

- **iOS Safari touch event coalescing:** webkit batches touch events, so naïve `touchmove` handlers feel laggy. Use `event.touches[0].clientY` with `requestAnimationFrame` to keep motion smooth.
- **Body scroll lock:** when drawer is open, the chat scroll behind it should NOT scroll. Lock body scroll on open, restore on close.
- **Safe-area-inset-bottom:** iPhone home indicator pushes content up. Drawer bottom edge must respect `env(safe-area-inset-bottom)`.
- **Address bar resize on Safari:** iOS Safari address bar shows/hides during scroll, changing viewport height. Drawer height should use `100dvh` not `100vh` to track dynamic viewport.
- **Velocity threshold for snap decision:** if user swipes fast in one direction, honor the direction even if they didn't cross the 50% line. Calculate velocity from last 2 touch positions divided by elapsed time.
- **Tile tap vs scroll:** tiles must distinguish between a tap (open tool) and a vertical scroll within the drawer (scroll the All Tools grid). Use a touch-move threshold of ~10px before deciding it's a scroll.
- **Drawer state persistence:** if user opens drawer, switches apps, returns — drawer should return to its last state, not reset to closed.
- **Implementation uses `85vh`, not `85dvh` (BUG, verified 2026-05-27):** Drawer height in the Push 6 markup is set with `85vh`, which on iOS Safari does not track the dynamic address bar. Drawer gets clipped at the bottom when the address bar is visible. Must change to `85dvh` (and audit any other `vh` usage in the drawer surface for the same hazard). This is the concrete instance of the `100dvh` rule above — call out by name so it doesn't get missed in review.
- **Touchmove handlers never follow the finger (BUG, verified 2026-05-27 — fixed in Push 7.1):** Push 6 peek-bar and handle touchmove handlers don't write `transform` during the drag at all. They watch the swipe distance and call `openDrawer()` / `closeDrawer()` once a fixed threshold is crossed (peek: dy > 40px, handle: dy > 50px). The result is the "snap, don't slide" feel Brandon flagged as rough. The fix in Push 7.1: drive `transform: translate3d(0, dy, 0)` during touchmove (wrapped in `requestAnimationFrame`), track velocity from delta-y over delta-t between touchmove samples, and on touchend snap to the nearest state using a ~40% distance threshold OR a velocity threshold of ±0.5 px/ms.

---

## Scenarios for e2e-tester

### Scenario 1: Open drawer with a fast swipe up

**User context:** Tech wants to access All Tools quickly during a job.
**Steps:**
1. User has contractor chat open, drawer is closed (peek bar visible).
2. User places finger on peek bar.
3. User swipes up rapidly (~300px in 200ms).
4. User releases.

**Expected outcome:** Drawer opens fully to ~75% screen height. Animation completes within 300ms after release. No stutter, no jank, motion follows finger then smoothly settles.

**Failure modes to watch for:**
- Drawer doesn't respond at all
- Drawer opens partially then snaps closed
- Animation stutters or skips frames
- Drawer opens but lands at wrong height
- Chat behind drawer scrolls during the gesture

---

### Scenario 2: Open drawer with a slow drag up

**User context:** Tech wants to see how far the drawer goes before committing to open it.
**Steps:**
1. Drawer is closed.
2. User places finger on peek bar.
3. User slowly drags upward, pausing partway (releasing slow, ~50px in 500ms).
4. User releases before reaching 50% threshold.

**Expected outcome:** Drawer follows finger in real time. When released below the 50% threshold with low velocity, drawer snaps smoothly back to closed state.

**Failure modes to watch for:**
- Drawer fights the user's finger (motion lags behind)
- Drawer stays stuck partway open
- Drawer snaps open instead of closed (wrong direction)

---

### Scenario 3: Close drawer by swiping down

**User context:** Tech opened the drawer to look at tools, changed their mind.
**Steps:**
1. Drawer is open at full height.
2. User places finger on the drawer top edge (drag handle area).
3. User swipes downward (~200px in 250ms).
4. User releases.

**Expected outcome:** Drawer follows finger downward smoothly. When released, drawer settles closed and returns to peek-bar state.

**Failure modes to watch for:**
- Drawer doesn't close
- Drawer flickers during close animation
- Drawer closes but peek bar disappears too

---

### Scenario 4: Tap a tool tile

**User context:** Tech opens drawer and wants to launch a specific tool from the All Tools grid.
**Steps:**
1. Drawer is open.
2. User taps one of the tool tiles in the All Tools 4-col grid.

**Expected outcome:** That tool launches. Drawer closes simultaneously (or just after). Chat shows the tool's interface or Mike's prompt for that tool.

**Failure modes to watch for:**
- Tile tap does nothing (tile is decorative, not wired)
- Tile launches wrong tool
- Drawer doesn't close after tap
- Tool launches but chat doesn't reflect it

---

### Scenario 5: Tap a peek bar favorite tile (drawer closed)

**User context:** Tech wants to use one of their favorites quickly, no need to open the full drawer.
**Steps:**
1. Drawer is closed, peek bar visible.
2. User taps one of the 4 favorite tiles in the peek bar.

**Expected outcome:** That tool launches immediately. No drawer animation needed. Chat reflects the tool.

**Failure modes to watch for:**
- Tap on peek tile opens the drawer instead of launching tool
- Peek tile is decorative, not wired
- Tool launches but is the wrong one

---

### Scenario 6: Tap a call entry to load job context

**User context:** Tech is on their second job of the day, wants to reload the first job's context to check something.
**Steps:**
1. Drawer is open.
2. User scrolls to Today's Calls section.
3. User taps the first call entry (e.g. "01 — Smith Residence — capacitor swap").

**Expected outcome:** Drawer closes. Chat loads that job's history/context. Mike acknowledges the switch ("Back on the Smith job — last we were at the capacitor swap, where do you want to pick up?").

**Failure modes to watch for:**
- Call entry tap does nothing
- Wrong job loads
- Chat clears but Mike doesn't acknowledge the context switch
- Job context loads but previous in-progress chat is lost (should be archived, not deleted)

---

### Scenario 7: Drawer behavior with keyboard open

**User context:** Tech is typing in chat input, then wants to open the drawer.
**Steps:**
1. User taps chat input. Keyboard opens.
2. User swipes up on peek bar to open drawer.

**Expected outcome:** Keyboard dismisses, drawer opens cleanly above the now-collapsed keyboard. Drawer height calculation accounts for keyboard dismissal.

**Failure modes to watch for:**
- Drawer opens behind keyboard
- Drawer height is wrong (calculated against viewport with keyboard up)
- Drawer opens but keyboard doesn't dismiss
- Drawer flickers as keyboard collapses

---

### Scenario 8: Drawer with empty Today's Calls

**User context:** First job of the day hasn't started yet. No calls in the list.
**Steps:**
1. User opens drawer.
2. User scrolls down to Today's Calls section.

**Expected outcome:** Section shows a friendly Mike-voice empty state, not blank. Something like "No calls on the board yet — Mike's ready when you roll out." Not a sterile "No data."

**Failure modes to watch for:**
- Section is completely blank (looks broken)
- Empty state is generic ("No items"), not Mike's voice
- Empty state breaks the visual rhythm of the drawer

---

### Scenario 9: Drawer state persistence across app backgrounding

**User context:** Tech opens drawer to check tools, gets a phone call, returns to app.
**Steps:**
1. User opens drawer to full height.
2. User switches to another app for ~30 seconds.
3. User returns to Trazer.

**Expected outcome:** Drawer is still open at the position they left it. State preserved.

**Failure modes to watch for:**
- Drawer is closed on return (state reset)
- Drawer is open but at wrong height
- Chat scroll position lost

---

### Scenario 10: Drawer with safe-area-inset-bottom respected on iPhone

**User context:** Tech is on iPhone with home indicator (no physical home button).
**Steps:**
1. User opens drawer.
2. User scrolls to bottom of All Tools grid.

**Expected outcome:** Bottom of drawer content sits ABOVE the home indicator with proper safe-area-inset-bottom padding. Drawer doesn't extend under the home indicator.

**Failure modes to watch for:**
- Content cut off behind home indicator
- Drawer extends to absolute screen bottom (no safe-area respect)
- Bottom content unreachable by tap

---

## Out of scope for this spec

- The CONTENT of individual tools (each tool gets its own spec — e.g. close-the-sale.md, callback-shield.md, recap-video.md)
- The PTT button (separate spec: ptt.md — lives in chat header, not drawer)
- The chat input mic for speech-to-text (separate spec: chat-mic.md — lives inside chat input, not drawer)
- Mike's chat bubbles or chat history (separate spec: chat.md)
- Language picker, profile menu, signout (separate specs)

---

## Sources / decisions

- **Locked direction:** Trade-tool aesthetic (Snap-On/Klein/Milwaukee/Carhartt/CB radio). Not Linear, not Whoop, not Cluely.
- **Locked structure:** Peek bar with 4 favorites above chat input. Swipe up = full drawer with three sections.
- **Locked feeling:** Drawer should feel like a Snap-On tool drawer — smooth, weighted, satisfying. Not a JavaScript modal.
- **Implementation choice:** Native `<dialog>` + CSS scroll-snap, NOT a third-party drawer library. Keeps bundle small, gives us full control over feel.
- **Design tokens:** Uses locked palette (--ink, --paper, --safety, --rust, --teal, --moss, --brass). Tiles in Whoop-style colorful gradients pinned to brand palette, not arbitrary colors.
- **Bug history:** Push 6 shipped drawer with rough swipe gestures (the bug Push 7.1 will fix). Original implementation used CSS transitions only, no gesture-velocity tracking. Push 7.1 adds touch handlers with velocity calculation.
