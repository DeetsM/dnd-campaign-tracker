# NPC Storage Setup

This document explains how to set up the NPCs (Non-Player Characters) table in Supabase for storing enemies and allies.

## Overview

The NPC storage system allows you to:
- Create and manage enemies for combat encounters
- Create and manage allies that fight alongside players
- Quick-add NPCs to combat from the Combat Tracker setup screen
- Organize NPCs by type (enemy or ally)

## Creating the NPCs Table

Run the following SQL in your Supabase dashboard to create the `npcs` table:

```sql
create table if not exists npcs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  max_hp integer not null,
  ac integer not null,
  initiative integer,
  type text not null check (type in ('enemy', 'ally')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

### Column Descriptions

- **id**: Unique identifier (UUID) - automatically generated
- **name**: The NPC's name
- **max_hp**: Maximum hit points
- **ac**: Armor Class
- **initiative**: Initiative modifier (optional)
- **type**: Either 'enemy' or 'ally'
- **created_at**: Timestamp when the NPC was created
- **updated_at**: Timestamp when the NPC was last updated

## Using NPCs in Combat

### Quick-Add Enemies and Allies

1. Go to **Combat Setup**
2. Under the "Quick Add NPCs" section, you'll see all your created NPCs
3. Enemies are shown with red chips, allies with green chips
4. Click any chip to add that NPC to the combat encounter

### Create NPCs

1. Go to **NPC Management** (add this to your navigation)
2. Use the form at the top to create new enemies or allies
3. Select the type from the dropdown
4. Fill in Name, Max HP, AC, and Initiative Modifier
5. Click "Add NPC"

### Organize NPCs

The NPC Management page has tabs for:
- **Enemies**: Combat opponents for your encounters
- **Allies**: NPCs that fight alongside the party

You can edit or delete any NPC from these tabs.

## Using NPCService in Code

The `NPCService` provides methods for managing NPCs:

```typescript
import { NPCService } from '../services/npcService';

// Get all NPCs (enemies and allies)
const allNPCs = await NPCService.getAll();

// Get only enemies
const enemies = await NPCService.getEnemies();

// Get only allies
const allies = await NPCService.getAllies();

// Get a specific NPC
const npc = await NPCService.getById(npcId);

// Create a new NPC
const newNPC = await NPCService.create({
  name: 'Goblin Warrior',
  maxHP: 15,
  ac: 14,
  initiative: 2,
  type: 'enemy'
});

// Update an NPC
const updated = await NPCService.update(npcId, {
  maxHP: 10 // Only update fields you need to change
});

// Delete an NPC
await NPCService.delete(npcId);
```

## Integration with CombatTracker

The `CombatTracker` component automatically loads all NPCs on startup and displays them in the quick-add section. When you click an NPC chip:

1. The NPC is added to the combat setup
2. If it's an enemy, it's marked as `isPlayer: false`
3. If it's an ally, it's still marked as `isPlayer: false` but has `npcType: 'ally'`

This allows the Combat Phase to distinguish between:
- **Players** (from Character Roster) - `isPlayer: true`
- **Enemies** (from NPC Manager) - `isPlayer: false, npcType: 'enemy'`
- **Allies** (from NPC Manager) - `isPlayer: false, npcType: 'ally'`

## Next Steps

After creating the NPCs table:

1. Go to **NPC Management**
2. Create some enemies and allies for your campaign
3. Start a new combat and use Quick Add NPCs to test the feature
