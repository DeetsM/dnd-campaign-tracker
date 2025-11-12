# Character Storage Setup

This guide will help you set up persistent character storage in your Supabase database.

## Create the Characters Table

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your **dnd-campaign-tracker** project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the following SQL and execute it:

```sql
-- Create characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  max_hp INTEGER NOT NULL,
  ac INTEGER NOT NULL,
  initiative INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX idx_characters_name ON characters(name);

-- Enable Row Level Security (RLS)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read/write (for development)
-- WARNING: In production, implement proper authentication
CREATE POLICY "Allow all operations" ON characters
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

5. You should see "Success" message

## How It Works

### Character Service Methods

The `CharacterService` provides these methods:

- **`getAll()`** - Fetch all saved characters
  ```typescript
  const characters = await CharacterService.getAll();
  ```

- **`getById(id)`** - Get a specific character
  ```typescript
  const character = await CharacterService.getById('character-id');
  ```

- **`create(character)`** - Save a new character
  ```typescript
  const newChar = await CharacterService.create({
    name: 'Aragorn',
    maxHP: 50,
    ac: 16,
    initiative: 3,
  });
  ```

- **`update(id, updates)`** - Update character details
  ```typescript
  await CharacterService.update('character-id', {
    maxHP: 45,
    ac: 17,
  });
  ```

- **`delete(id)`** - Delete a character
  ```typescript
  await CharacterService.delete('character-id');
  ```

- **`deleteMany(ids)`** - Delete multiple characters
  ```typescript
  await CharacterService.deleteMany(['id1', 'id2']);
  ```

## Usage in Components

Import and use in your React components:

```typescript
import { CharacterService } from '../services/characterService';

// In your component
useEffect(() => {
  const loadCharacters = async () => {
    const characters = await CharacterService.getAll();
    setCharacters(characters);
  };
  
  loadCharacters();
}, []);
```

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier (auto-generated) |
| `name` | TEXT | Character name (must be unique) |
| `max_hp` | INTEGER | Maximum hit points |
| `ac` | INTEGER | Armor class |
| `initiative` | INTEGER | Initiative modifier (default: 0) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Next Steps

1. **Execute the SQL above** to create the characters table in your Supabase database
2. **Test the Character Roster** by:
   - Going to the Character Roster page
   - Creating a new character (name, HP, AC, initiative)
   - Clicking "Add Character"
   - Verify it appears in the list
3. **Check Supabase** to confirm the character was saved:
   - Go to your Supabase dashboard
   - Select the **dnd-campaign-tracker** project
   - Go to **Tables** → **characters**
   - You should see your character listed

## Features

✅ **Create Characters** - Add new character templates once  
✅ **Edit Characters** - Update character stats anytime  
✅ **Delete Characters** - Remove characters you no longer need  
✅ **Persistent Storage** - Characters saved to cloud database  
✅ **Quick Access** - Load pre-made characters for combat encounters  
✅ **Unique Names** - Character names must be unique (prevents duplicates)  

## Using Saved Characters in Combat

When you set up a combat encounter:
1. Go to **Character Roster** and create/edit your character templates
2. Go to **Combat Tracker**
3. The character roster is available for quick reference
4. Use your saved characters to quickly set up combat participants

## API Documentation

### CharacterService

Complete API for character management:

```typescript
import { CharacterService, type StoredCharacter } from '../services/characterService';

// Get all characters
const all = await CharacterService.getAll();

// Get single character
const one = await CharacterService.getById(id);

// Create new character
const created = await CharacterService.create({
  name: 'Character Name',
  maxHP: 100,
  ac: 15,
  initiative: 2,
});

// Update character
const updated = await CharacterService.update(id, {
  maxHP: 95,
  ac: 16,
});

// Delete single character
const success = await CharacterService.delete(id);

// Delete multiple characters
const success = await CharacterService.deleteMany([id1, id2]);
```

## Troubleshooting

**"Character already exists"** - Character names must be unique. Try renaming the character.

**Characters not loading** - Make sure you've created the `characters` table in Supabase using the SQL above.

**Can't save changes** - Check browser console (F12) for error messages. Ensure your Supabase environment variables are correct.

**"RLS policy violation"** - Ensure you've enabled RLS and created the "Allow all operations" policy in Supabase.

## Advanced Usage

### Loading Characters in Other Components

```typescript
import { CharacterService } from '../services/characterService';

export function MyComponent() {
  const [characters, setCharacters] = useState([]);
  
  useEffect(() => {
    const load = async () => {
      const chars = await CharacterService.getAll();
      setCharacters(chars);
    };
    load();
  }, []);
  
  return (
    // Render characters...
  );
}
```

### Pre-populating Combat

In the future, you could add a feature to quickly select saved characters when setting up combat, automatically filling in their stats!

For integration code, see the main documentation.
