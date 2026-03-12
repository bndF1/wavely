#!/usr/bin/env bash
# =============================================================================
# Wavely — GitHub Project Kanban Setup
# =============================================================================
# Prerequisites:
#   1. gh CLI installed  (brew install gh)
#   2. Authenticated     (gh auth login)
#   3. Run from repo root or anywhere — OWNER/REPO are hardcoded below
#
# Usage:
#   bash scripts/setup-kanban.sh
# =============================================================================

set -euo pipefail

OWNER="bndF1"
REPO="wavely"

echo "🎙️  Wavely Kanban Setup"
echo "========================"

# ---------------------------------------------------------------------------
# 1. Create Labels
# ---------------------------------------------------------------------------
echo ""
echo "📌 Creating labels..."

create_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" --color "$color" --description "$description" \
    --repo "$OWNER/$REPO" --force 2>/dev/null && echo "  ✅ $name" || echo "  ⚠️  $name (may already exist)"
}

# Epics
create_label "epic: audio-player"   "7B68EE" "Audio playback engine & UI"
create_label "epic: home"           "FF8C00" "Home feed page"
create_label "epic: search"         "4169E1" "Search functionality"
create_label "epic: browse"         "2E8B57" "Browse / Discovery page"
create_label "epic: library"        "DC143C" "User library & subscriptions"
create_label "epic: podcast-detail" "8B008B" "Podcast detail page"
create_label "epic: episode-detail" "008B8B" "Episode detail page"
create_label "epic: auth"           "B8860B" "Authentication & user profile"
create_label "epic: native"         "556B2F" "iOS & Android native targets"
create_label "epic: infra"          "696969" "Infrastructure, CI/CD, deploy"

# Types
create_label "type: feature"        "0075ca" "New feature"
create_label "type: bug"            "d73a4a" "Bug fix"
create_label "type: chore"          "e4e669" "Maintenance / chore"
create_label "type: design"         "f9d0c4" "UI/UX design work"

# Priority
create_label "priority: high"       "FF0000" "Must have for MVP"
create_label "priority: medium"     "FFA500" "Important but not blocking"
create_label "priority: low"        "90EE90" "Nice to have"

# ---------------------------------------------------------------------------
# 2. Create Issues
# ---------------------------------------------------------------------------
echo ""
echo "📋 Creating issues..."

create_issue() {
  local title="$1" body="$2" labels="$3"
  gh issue create \
    --repo "$OWNER/$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    2>/dev/null
  echo "  ✅ $title"
}

# ── Epic: Audio Player ───────────────────────────────────────────────────────
create_issue \
  "feat: mini player component docked above tab bar" \
  "## Goal
Build a persistent mini player that appears above the bottom tab bar whenever an episode is playing.

## Acceptance Criteria
- Shows episode artwork (40×40), title, podcast name
- Play/pause button with correct icon state
- Progress bar (thin, not interactive)
- Tapping anywhere on the mini player opens the full-screen player
- Smoothly animates in/out when playback starts/stops
- Works on iOS, Android, and Web

## Implementation Notes
- Use \`PlayerStore\` signals for state
- Ionic \`IonToolbar\` or a custom positioned component above \`IonTabBar\`
- CSS \`position: sticky\` / \`ion-footer\` pattern" \
  "epic: audio-player,type: feature,priority: high"

create_issue \
  "feat: full-screen player with scrubber, speed control, and skip buttons" \
  "## Goal
Full-screen player modal with complete playback controls.

## Acceptance Criteria
- Large episode artwork
- Episode title + podcast name
- Interactive scrubber with current/total time
- Play/pause, next/prev episode buttons
- Skip back 15s / skip forward 30s
- Playback speed selector: 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×
- Sleep timer (future)
- Swipe down to dismiss

## Implementation Notes
- \`IonModal\` with \`breakpoints\` for swipe-to-dismiss
- Scrubber: native \`<ion-range>\`
- Speed: \`PlayerStore.setSpeed()\` → HTML Audio \`playbackRate\`" \
  "epic: audio-player,type: feature,priority: high"

create_issue \
  "feat: background audio playback with lock screen controls (Capacitor)" \
  "## Goal
Keep audio playing when the app is backgrounded on iOS/Android and show lock screen media controls.

## Acceptance Criteria
- Audio continues when app goes to background (iOS/Android)
- Lock screen / notification shows artwork, title, play/pause
- Lock screen controls work (play/pause, next, prev)
- Web: standard \`<audio>\` element handles this natively

## Implementation Notes
- Use \`@capacitor-community/background-mode\` or \`capacitor-music-controls-plugin\`
- AVAudioSession configuration for iOS
- MediaSession API for Web" \
  "epic: audio-player,type: feature,priority: high"

create_issue \
  "feat: playback progress persistence (resume where you left off)" \
  "## Goal
Persist playback position per episode so users can resume after closing the app.

## Acceptance Criteria
- Position saved every 5 seconds while playing
- On re-open, episode resumes from last position
- \`PlaybackProgress\` model stored in Firestore (or localStorage for guests)
- Progress indicator on episode list items (small filled arc on artwork)

## Implementation Notes
- \`PlaybackProgress\` interface already defined in \`podcast.model.ts\`
- Firestore path: \`users/{uid}/progress/{episodeId}\`
- Debounce writes to Firestore (5s interval)" \
  "epic: audio-player,type: feature,priority: medium"

# ── Epic: Home Page ──────────────────────────────────────────────────────────
create_issue \
  "feat: home page — continue listening section" \
  "## Goal
Show in-progress episodes at the top of the home feed.

## Acceptance Criteria
- Horizontal scroll list of episodes with partial playback progress
- Shows progress bar under each episode artwork
- Tapping plays the episode resuming from saved position
- Hidden when user has no in-progress episodes

## Implementation Notes
- Source from \`PlaybackProgress\` Firestore collection filtered by \`completed = false\`
- Use \`PodcastsStore\` to provide the data" \
  "epic: home,type: feature,priority: high"

create_issue \
  "feat: home page — subscriptions feed (latest episodes)" \
  "## Goal
Show a chronological feed of new episodes from podcasts the user subscribes to.

## Acceptance Criteria
- List of latest episodes sorted by publish date (newest first)
- Each item: artwork, episode title, podcast name, age, duration
- Pull-to-refresh
- Empty state with CTA to browse/search

## Implementation Notes
- Fetch latest episodes for each subscription via iTunes Lookup API
- Paginate locally (show 20 at a time)" \
  "epic: home,type: feature,priority: high"

create_issue \
  "feat: home page — trending / featured podcasts grid" \
  "## Goal
Discovery section at the bottom of the home page with trending podcasts.

## Acceptance Criteria
- 2-column grid of podcast artwork cards
- Tapping opens Podcast Detail
- Data source: iTunes top charts endpoint
- Section is collapsible

## Implementation Notes
- iTunes RSS feed: \`https://rss.applemarkets.com/api/v2/us/podcasts/top-podcasts/all/25/explicit.json\`
- Cache results for 1 hour" \
  "epic: home,type: feature,priority: medium"

# ── Epic: Search ─────────────────────────────────────────────────────────────
create_issue \
  "feat: search page — real-time search with debounce" \
  "## Goal
Search for podcasts using the iTunes Search API with a debounced input.

## Acceptance Criteria
- Search input at top of page (autofocused)
- Results update as user types (300ms debounce)
- Shows podcast artwork, title, author, episode count
- Tapping a result opens Podcast Detail
- Loading skeleton while fetching
- Error state on API failure

## Implementation Notes
- Wire \`PodcastsStore.search(query)\` to the Ionic \`ion-searchbar\` component
- \`PodcastApiService.searchPodcasts()\` already implemented" \
  "epic: search,type: feature,priority: high"

create_issue \
  "feat: search page — recent searches history" \
  "## Goal
Show recent searches when the search input is focused and empty.

## Acceptance Criteria
- Last 10 searches shown as chips
- Tapping a chip fills the search input and triggers search
- Clear individual or all recent searches
- Persisted in localStorage

## Implementation Notes
- \`localStorage.getItem('wavely:recent-searches')\` → JSON array
- Signal-based store slice or local component state" \
  "epic: search,type: feature,priority: low"

# ── Epic: Browse ─────────────────────────────────────────────────────────────
create_issue \
  "feat: browse page — categories/genres grid" \
  "## Goal
Show podcast categories as a tappable grid for discovery.

## Acceptance Criteria
- Grid of genre tiles with distinct colors/icons
- Tapping a genre shows top podcasts in that genre
- At least 15 categories (Comedy, News, Sports, True Crime, Tech, etc.)

## Implementation Notes
- iTunes genre IDs are static — hardcode the list
- Genre tile: colored background + white icon + label
- Sub-page: list of top podcasts filtered by genreId" \
  "epic: browse,type: feature,priority: medium"

create_issue \
  "feat: browse page — top charts" \
  "## Goal
Show top podcast charts (overall + per category).

## Acceptance Criteria
- Ranked list (1–25) with rank badge, artwork, title, author
- Filter by category (dropdown or segmented control)
- Pull-to-refresh
- Tapping opens Podcast Detail

## Implementation Notes
- iTunes RSS API: \`https://rss.applemarkets.com/api/v2/us/podcasts/top-podcasts/genre/{id}/25/explicit.json\`" \
  "epic: browse,type: feature,priority: medium"

# ── Epic: Library ─────────────────────────────────────────────────────────────
create_issue \
  "feat: library page — subscriptions list" \
  "## Goal
Show all podcasts the user is subscribed to.

## Acceptance Criteria
- Alphabetically sorted list of subscribed podcasts
- Each row: artwork, title, author, unplayed episode count badge
- Swipe left to unsubscribe
- Empty state with CTA to discover podcasts
- Persisted in Firestore (authenticated users) or localStorage (guests)

## Implementation Notes
- \`PodcastsStore.subscriptions\` signal
- Firestore path: \`users/{uid}/subscriptions/{podcastId}\`" \
  "epic: library,type: feature,priority: high"

create_issue \
  "feat: library page — downloaded episodes" \
  "## Goal
Show episodes saved for offline listening.

## Acceptance Criteria
- List of downloaded episodes with file size shown
- Play directly from device (no network needed)
- Swipe left to delete download
- Download progress indicator when downloading

## Implementation Notes
- Use Capacitor Filesystem plugin for storing audio files
- iOS: Documents directory; Android: External files dir
- Web: Not supported — show message" \
  "epic: library,type: feature,priority: low"

# ── Epic: Podcast Detail ──────────────────────────────────────────────────────
create_issue \
  "feat: podcast detail page — header, subscribe, and episode list" \
  "## Goal
Full podcast detail page with info and scrollable episode list.

## Acceptance Criteria
- Collapsible header: large artwork, title, author, description
- Subscribe / Unsubscribe button (synced with PodcastsStore)
- Scrollable episodes list (virtual scroll for large feeds)
- Each episode: title, date, duration, play button
- 'Mark all as played' and 'Download all' action menu
- Skeleton loading state

## Implementation Notes
- iTunes Lookup API: \`https://itunes.apple.com/lookup?id={feedId}&media=podcast&entity=podcastEpisode&limit=200\`
- \`IonVirtualScroll\` or CDK Virtual Scroll for episode list" \
  "epic: podcast-detail,type: feature,priority: high"

# ── Epic: Episode Detail ──────────────────────────────────────────────────────
create_issue \
  "feat: episode detail page — description, play, and actions" \
  "## Goal
Episode detail sheet with full description and action buttons.

## Acceptance Criteria
- Episode artwork, title, podcast name, publish date, duration
- Rendered HTML description (linkify, strip dangerous tags)
- Play / Add to queue buttons
- Download button (with progress)
- Share button (Capacitor Share plugin)
- 'Mark as played' toggle

## Implementation Notes
- Use \`[innerHTML]\` with \`DomSanitizer\` for HTML description
- \`@capacitor/share\` for native share sheet" \
  "epic: episode-detail,type: feature,priority: medium"

# ── Epic: Auth ────────────────────────────────────────────────────────────────
create_issue \
  "feat: Firebase Auth — Google Sign-In and persistent session" \
  "## Goal
Allow users to sign in with Google to sync their library and progress across devices.

## Acceptance Criteria
- Sign-in screen accessible from Library tab (for unauthenticated users)
- Google Sign-In button (web: redirect; native: Capacitor Google Auth)
- Session persists across app restarts
- Sign-out from settings
- Graceful fallback: app works in guest mode (localStorage only)

## Implementation Notes
- Fill in \`core/services/firebase.config.ts\` with real Firebase project credentials
- \`@angular/fire/auth\` \`signInWithRedirect\` for web
- \`@codetrix-studio/capacitor-google-auth\` for native
- Auth guard on protected routes" \
  "epic: auth,type: feature,priority: medium"

create_issue \
  "feat: user profile page" \
  "## Goal
Simple profile screen showing user info and app settings.

## Acceptance Criteria
- Avatar, display name, email
- App settings: default playback speed, skip intervals, theme (light/dark/system)
- Storage usage indicator (downloads)
- Sign-out button
- Version info

## Implementation Notes
- Settings persisted via \`localStorage\` / Capacitor Preferences
- Route: \`/settings\` (accessible from Library or a dedicated tab in the future)" \
  "epic: auth,type: feature,priority: low"

# ── Epic: Native Platforms ────────────────────────────────────────────────────
create_issue \
  "chore: add iOS Capacitor target and configure Xcode project" \
  "## Goal
Set up and test the iOS native build.

## Acceptance Criteria
- \`bunx cap add ios\` succeeds
- App launches in iOS Simulator
- Tab navigation works
- iTunes API calls work (HTTP + ATS config)
- App icons and splash screen configured with Wavely branding

## Implementation Notes
- \`bunx cap add ios\`
- \`bunx cap open ios\` → Xcode
- \`Info.plist\`: add NSAppTransportSecurity for iTunes API domain
- Use \`@capacitor/assets\` to generate icons from a single source image" \
  "epic: native,type: chore,priority: medium"

create_issue \
  "chore: add Android Capacitor target and configure Gradle project" \
  "## Goal
Set up and test the Android native build.

## Acceptance Criteria
- \`bunx cap add android\` succeeds
- App launches in Android Emulator
- Tab navigation works
- App icons and splash screen configured with Wavely branding

## Implementation Notes
- \`bunx cap add android\`
- \`bunx cap open android\` → Android Studio
- \`AndroidManifest.xml\`: INTERNET permission (already default)
- Use \`@capacitor/assets\` to generate icons" \
  "epic: native,type: chore,priority: medium"

# ── Epic: Infrastructure ──────────────────────────────────────────────────────
create_issue \
  "chore: Firebase project setup — Firestore schema and security rules" \
  "## Goal
Set up Firestore database with proper schema and security rules.

## Acceptance Criteria
- Firestore collections defined: \`users\`, \`users/{uid}/subscriptions\`, \`users/{uid}/progress\`
- Security rules: users can only read/write their own data
- \`firebase.config.ts\` populated with real credentials (via env vars, not hardcoded)
- Emulator suite configured for local dev (\`firebase.json\`)

## Implementation Notes
- \`firebase init firestore\`
- Store Firebase config in \`.env.local\` and inject at build time via \`@angular/build\` define" \
  "epic: infra,type: chore,priority: medium"

create_issue \
  "chore: Firebase Hosting deployment + preview channels" \
  "## Goal
Deploy the web app to Firebase Hosting with preview channels for PRs.

## Acceptance Criteria
- \`firebase deploy --only hosting\` deploys to \`wavely.web.app\`
- GitHub Actions deploys to a preview channel on every PR
- GitHub Actions deploys to production on merge to \`main\`

## Implementation Notes
- \`firebase init hosting\` — public dir: \`dist/wavely/browser\`
- Add \`firebase-hosting-pull-request.yml\` GitHub Action
- Add \`firebase-hosting-merge.yml\` GitHub Action" \
  "epic: infra,type: chore,priority: low"

# ---------------------------------------------------------------------------
# 3. Create GitHub Project (v2)
# ---------------------------------------------------------------------------
echo ""
echo "🗂️  Creating GitHub Project (v2)..."

PROJECT_URL=$(gh project create \
  --owner "$OWNER" \
  --title "Wavely Roadmap" \
  --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url',''))" || echo "")

if [ -z "$PROJECT_URL" ]; then
  # Try without --format json (older gh versions)
  PROJECT_URL=$(gh project create --owner "$OWNER" --title "Wavely Roadmap" 2>/dev/null || echo "")
fi

if [ -n "$PROJECT_URL" ]; then
  echo "  ✅ Project created: $PROJECT_URL"
  
  # Get project number for issue linking
  PROJECT_NUMBER=$(gh project list --owner "$OWNER" --format json 2>/dev/null \
    | python3 -c "import sys,json; projects=json.load(sys.stdin)['projects']; p=[x for x in projects if x['title']=='Wavely Roadmap']; print(p[0]['number'] if p else '')" 2>/dev/null || echo "")
  
  if [ -n "$PROJECT_NUMBER" ]; then
    echo "  📌 Linking all issues to project #$PROJECT_NUMBER..."
    # Add all open issues to the project
    gh issue list --repo "$OWNER/$REPO" --state open --limit 100 --json number \
      | python3 -c "import sys,json; [print(i['number']) for i in json.load(sys.stdin)]" \
      | while read -r issue_num; do
          gh project item-add "$PROJECT_NUMBER" \
            --owner "$OWNER" \
            --url "https://github.com/$OWNER/$REPO/issues/$issue_num" \
            2>/dev/null && echo "    + Issue #$issue_num"
        done
  fi
else
  echo "  ⚠️  Could not create project automatically."
  echo "      Create it manually at: https://github.com/$OWNER?tab=projects"
  echo "      Then bulk-add issues from: https://github.com/$OWNER/$REPO/issues"
fi

# ---------------------------------------------------------------------------
# 4. Summary
# ---------------------------------------------------------------------------
echo ""
echo "✅ Done!"
echo ""
echo "📊 Issues created:"
gh issue list --repo "$OWNER/$REPO" --state open --limit 100 | head -30
echo ""
echo "🔗 Issues:  https://github.com/$OWNER/$REPO/issues"
echo "🗂️  Project: https://github.com/orgs/$OWNER/projects  (or https://github.com/users/$OWNER/projects)"
