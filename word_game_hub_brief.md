# Yodoku - Development Brief

## Project Overview
A web-based educational word game hub featuring two core puzzle games with a placeholder for future expansion to three games. The app targets both children and adults who prefer logical, letter-based challenges over fantasy games. The focus is on educational value while maintaining engagement.

## Hub and Game Names
- **Hub Name**: Yodoku (or alternatives: PuzzleWord Central, WordLogic Hub)
- **Game 1**: LetterMix (String Cleanup with mixed letters)
- **Game 2**: WordPool (Category Constraint Challenge)
- **Game 3**: [Placeholder - to be defined later]

## Core Philosophy
- **Pure word mechanics** - no storylines, characters, or fantasy elements
- **Letter-focused gameplay** - working with actual word structure and vocabulary
- **Logic-based rules** - clear, systematic, and learnable patterns
- **Educational value** - builds vocabulary, spelling, and logical thinking
- **Clean, distraction-free design** - focus on the puzzles, not flashy graphics

## Application Structure

### Main Hub (Landing Page)
```
yodoku HUB
┌─────────────────────────────────┐
│  🧩 LETTERMIX                   │
│  Find and remove words from     │
│  mixed letter puzzles           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  📝 WORDPOOL                    │
│  Name words that fit given      │
│  categories with constraints    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🎯 COMING SOON                 │
│  Third game placeholder         │
│  [Locked for future release]    │
└─────────────────────────────────┘
```

## Game Details

### Game 1: LetterMix (Advanced String Cleanup)
**Objective:** Find and remove valid English words from a completely mixed letter string until nothing remains.

**Advanced Mechanics:**
- Letters are **completely scrambled** (not in word order)
- Example: Instead of "TABLEFORKSPOON" you get "BLETAFORKNOSOP"
- Players must find words using **non-consecutive letters** from the string
- **Strategic depth**: Removing some words reveals letters needed for other words
- **Multiple solution paths**: Same string can be solved in different ways

**Complex Examples:**
```
Input: BLETAFORKNOSOP (mixed: TABLE, FORK, SPOON)
Solution 1: 
- Find "FORK" (F-O-R-K) → Remaining: BLETANOSOP
- Find "TABLE" (T-A-B-L-E) → Remaining: NOSOP  
- Find "SPOON" (S-P-O-O-N) → Wait, need two O's but only one left!
- Must try different approach...

Solution 2:
- Find "SPOON" (S-P-O-O-N) → Remaining: BLETAFORK
- Find "TABLE" (T-A-B-L-E) → Remaining: FORK
- Find "FORK" (F-O-R-K) → Success!
```

**Difficulty Progression:**
- **Easy**: 15-20 letters, 3 words, obvious category hint ("Kitchen Items")
- **Medium**: 25-35 letters, 4-5 words, broader hint ("Things in a House")  
- **Hard**: 40+ letters, 6-8 words, minimal hint ("Daily Life"), overlapping letter requirements

**Strategic Elements:**
- **Letter dependency**: Some words share letters, must find optimal removal order
- **Category hints**: Provide thematic guidance without being too obvious
- **Multiple valid solutions**: Encourages experimentation and replay value

**UI Elements:**
- **Letter string display** with individual clickable/selectable letters
- **Selection highlighting** as user builds words
- **Word validation** with immediate feedback
- **Category hint display** at top of screen
- **Found words list** showing progress
- **Remaining letters counter**
- **Hint system**: "Try looking for a 4-letter kitchen tool"
- **Solution alternatives**: After completion, show other valid solution paths
### Game 2: WordPool (Category Constraint Challenge)
**Objective:** Input words that belong to a given category, working through progressively challenging constraint levels.

**Progressive Difficulty System:**

**Level Structure per Category:**
```
Category: "Animals"
Level 1: "Animals" (100+ possible words) - Easy entry
Level 2: "Wild Animals" (60+ words) - First constraint
Level 3: "African Animals" (30+ words) - Geographic constraint  
Level 4: "Large African Animals" (15+ words) - Size + geographic
Level 5: "Large African Carnivores" (8+ words) - Multiple constraints
Level 6: "Large African Cats" (4-6 words) - Maximum specificity
```

**Constraint Types:**
- **Geographic**: "Asian animals", "Forest animals", "Ocean animals"
- **Physical**: "Flying animals", "Four-legged animals", "Animals with stripes"  
- **Behavioral**: "Nocturnal animals", "Pack animals", "Hibernating animals"
- **Size**: "Large animals", "Tiny animals", "Animals smaller than humans"
- **Diet**: "Carnivores", "Herbivores", "Animals that eat fish"
- **Habitat**: "Farm animals", "Pet animals", "Zoo animals"

**Multiple Categories Available:**
- Animals (with 6 difficulty levels)
- Food & Cooking (with 6 difficulty levels)
- Transportation (with 6 difficulty levels)  
- Nature & Plants (with 6 difficulty levels)
- Occupations (with 6 difficulty levels)
- Sports & Activities (with 6 difficulty levels)

**Gameplay Mechanics:**
- **Word Pool Validation**: Each category/level has a pre-defined list of acceptable words
- **Progressive Unlocking**: Must complete level N to unlock level N+1
- **Completion Tracking**: Show "Found 8/12 possible words" progress
- **Hint System**: 
  - "Try thinking about nocturnal hunters" 
  - "Word starts with 'L'"
  - "Think about something that roars"

**Educational Value:**
- **Vocabulary Building**: Exposure to specialized terminology
- **Category Understanding**: Learn relationships between concepts
- **Knowledge Depth**: Progress from general to specific knowledge
- **Critical Thinking**: Understand how constraints narrow possibilities

**UI Elements:**
- **Category and Level Display**: "Animals - Level 4: Large African Animals"
- **Text input field** with auto-complete suggestions
- **Accepted words list** showing found words
- **Progress indicator**: "Found 6/15 possible words"
- **Hint button** with contextual clues
- **Level completion celebration** when word pool is exhausted
- **Next level unlock** with preview of new constraints
### Game 3: [Future Game - Placeholder]
**Implementation Notes for Developer:**
- Reserve UI space and navigation for third game
- Create placeholder screens with "Coming Soon" messaging
- Structure code to easily accommodate third game addition
- Consider similar complexity level to Games 1 and 2
- Maintain consistent design language across all three games
- Plan for same daily puzzle rotation system

**UI Placeholder Elements:**
- Locked game card in main hub
- "Coming Soon" messaging with planned release info
- Navigation structure that supports third game addition
- Consistent theming and color scheme preparation

## Daily Content Generation Strategy

### LetterMix Content:
- **Word Pool**: Use curated lists of thematically related words
- **Scrambling Algorithm**: Randomly mix all letters from the word set
- **Category Themes**: Rotate through different categories daily
- **Difficulty Scaling**: Increase word count and letter overlap complexity
- **Pre-validation**: Ensure each puzzle has at least one valid solution path

### WordPool Content:
- **Category Database**: Pre-built hierarchical category structures
- **Word Lists**: Manually curated and validated word pools per level
- **Progressive Difficulty**: Each category has 6 increasing constraint levels
- **Daily Rotation**: Cycle through different categories and levels
- **Quality Assurance**: Regular review of word list accuracy and educational value

## Technical Stack Recommendations

### Frontend
- **React** with TypeScript for component-based architecture
- **Tailwind CSS** for clean, responsive styling
- **Framer Motion** for subtle animations (letter movements, success celebrations)

### State Management
- **Zustand** or **Redux Toolkit** for game state management
- Local Storage for progress tracking and high scores

### Backend/Data
- **Static JSON files** for word lists and game data (no database needed initially)
- **Vercel/Netlify** for hosting (static deployment)

### Word Validation
- Use dictionary API or local word list (enable-cors.org/dictionary API or local JSON)
- Pre-computed category word lists stored in JSON files

## Visual Design Philosophy

### Color Scheme
- **Primary**: Clean whites and light grays (#FAFAFA, #F5F5F5)
- **Accent**: Soft blue for interactive elements (#3B82F6)
- **Success**: Gentle green (#10B981)
- **Error**: Muted red (#EF4444)
- **Text**: Dark gray (#1F2937)

### Typography
- **Headers**: Clean sans-serif (Inter, Poppins)
- **Game text**: Monospace for letter-based games (Fira Code, Source Code Pro)
- **Size hierarchy**: Clear distinction between game elements and UI

### Layout Principles
- **Minimalist design** - focus on content, not decoration
- **Large touch targets** - mobile-friendly for children
- **High contrast** - good readability
- **Consistent spacing** - 8px grid system
- **Card-based layout** - clear game separation

### Animation Guidelines
- **Subtle transitions** - 200-300ms for state changes
- **Letter movements** - smooth sliding for swaps and removals
- **Success feedback** - gentle bounce or fade effects
- **Loading states** - simple spinners or skeleton screens

## User Experience Flow

### First Time User
1. Land on hub with game explanations
2. Click any game to see tutorial/demo
3. Start with Easy difficulty
4. Clear progress indicators throughout

### Returning User
1. Hub shows progress on each game type
2. Quick access to current difficulty level
3. Option to restart or continue where left off

### Mobile Considerations
- Touch-friendly letter selection
- Responsive design for phones/tablets
- Consider swipe gestures for letter swapping
- Virtual keyboard optimization

## Educational Features
- **Vocabulary building** through exposure to varied words
- **Pattern recognition** in letter arrangements
- **Logical thinking** through systematic problem solving
- **Spelling reinforcement** through word validation
- **Category knowledge** building through themed challenges

## Future Enhancement Ideas
- Daily challenges with unique puzzles
- Achievement system for consistent play
- Difficulty adaptation based on performance
- Multiplayer versions for classroom use
- Progress tracking and analytics for educators

## Development Priorities
1. **Core game mechanics** - get the basic gameplay working
2. **Clean UI implementation** - focus on usability
3. **Word validation system** - ensure accurate game logic  
4. **Mobile responsiveness** - optimize for touch devices
5. **Polish and refinement** - animations and feedback

This brief should give your Cursor AI agent a comprehensive understanding of what you want to build, with specific technical guidance and clear design principles that avoid the "fantasy game" aesthetic while maintaining educational value and engagement.
