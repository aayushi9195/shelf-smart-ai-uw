

# Enhanced Sourcing Alerts & AI Chat Notification System

## Overview
Three interconnected features: (1) Detailed sourcing alerts with restock action, (2) A wait-queue for users wanting notifications on out-of-stock items, (3) Conversational AI that remembers user preferences and notifies them when items are restocked.

## Changes

### 1. Expand Data Model (`src/data/store.ts` & `src/context/StoreContext.tsx`)

- Add a `WaitlistEntry` interface: `{ id, productId, productName, userName, timestamp }`
- Add a `Notification` interface: `{ id, userName, productName, message, timestamp, read }`
- Add `requestedQty` field to `RestockAlert` so the owner sees *how much* is needed
- Aggregate waitlist entries per product into each `RestockAlert` (so the alert shows total demand and who is waiting)
- Add new state and functions to `StoreContext`:
  - `waitlist: WaitlistEntry[]` and `addToWaitlist(productId, productName, userName)`
  - `notifications: Notification[]` and `addNotification(...)`, `markNotificationRead(id)`
  - `restockProduct(productId, qty)` -- simulates owner restocking: updates product stock, resolves the alert, and auto-generates notifications for every user on the waitlist for that product

### 2. Upgrade Sourcing Alerts Panel (`src/pages/Dashboard.tsx`)

Current state: alerts show product name, requester, and a simple "Resolve" button.

New design for each alert card:
- Product name and emoji
- **Demand summary**: total quantity requested and number of waiting customers (e.g., "3 customers waiting, ~8 kg requested")
- List of waitlisted users with their names
- **"Restock" button** with a small input field for the quantity to restock
- When owner clicks "Restock":
  - Product stock is updated in state
  - Alert is marked resolved
  - All waitlisted users for that product receive a notification (simulated via context state)
  - A toast confirmation shows "Restocked! 3 customers have been notified."

### 3. Make AI Chat Conversational with Memory (`src/components/AIChatAssistant.tsx`)

Current problem: the chat uses simple regex matching with no memory of prior messages. If a user says "yes" to a follow-up question, the bot doesn't understand.

Solution -- add a lightweight conversation state machine:
- Track a `pendingAction` state: `{ type: 'waitlist_prompt', productId, productName } | null`
- When the AI detects an out-of-stock item and informs the user, it sets `pendingAction` to `waitlist_prompt`
- If the user's next message is affirmative ("yes", "sure", "yeah", "notify me", etc.):
  - The bot asks "What's your name so we can notify you?" and sets `pendingAction` to `waitlist_name_prompt`
- When the user provides their name:
  - Call `addToWaitlist(productId, productName, userName)`
  - Confirm: "Got it, [name]! We'll notify you when [product] is back in stock."
  - Clear `pendingAction`
- If the user says "no" or changes topic, clear `pendingAction` and process normally

### 4. User Notification Display (`src/components/AIChatAssistant.tsx`)

- When the chat opens, check if there are any unread notifications for the current "user" (matched by name from waitlist)
- If notifications exist, inject them as assistant messages at the top: "Great news! [Product] is back in stock. Would you like to add some to your cart?"
- This simulates the "alert the user once the owner stocks it back" flow

### 5. Notification Bell on Header (`src/components/Header.tsx`)

- Add a small bell icon with a badge count showing unread notifications
- Clicking it opens a dropdown listing recent notifications (e.g., "Avocados are back in stock!")
- This provides visibility even outside the chat

## Technical Details

All state remains in `StoreContext` (no backend needed). The "restock" action mutates the products array in memory. The waitlist-to-notification pipeline is triggered synchronously when the owner clicks "Restock."

### Files Modified
| File | Change |
|------|--------|
| `src/data/store.ts` | Add `WaitlistEntry`, `Notification` interfaces; add `requestedQty` to `RestockAlert` |
| `src/context/StoreContext.tsx` | Add waitlist, notifications, restockProduct state & functions |
| `src/pages/Dashboard.tsx` | Redesign alert cards with demand info, restock input, and notify-on-restock |
| `src/components/AIChatAssistant.tsx` | Add conversation state machine for follow-ups, waitlist flow, and notification display |
| `src/components/Header.tsx` | Add notification bell with unread count |

