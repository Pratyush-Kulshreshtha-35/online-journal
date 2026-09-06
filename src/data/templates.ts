import { JournalTemplate } from '../types/journal';

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'five-minute-morning',
    name: '5-Minute Morning',
    description: 'Anchor your day with gratitude, intentional focus, and daily affirmation.',
    emoji: '☀️',
    category: 'Daily Ritual',
    mood: 'energized',
    defaultTags: ['Morning', 'Gratitude', 'Focus'],
    titleSuggestion: 'Morning Focus & Intentions',
    structure: `### 🌅 3 Things I am Grateful For
1. 
2. 
3. 

### 🎯 What Would Make Today Great?
- **Priority 1:** 
- **Priority 2:** 
- **Small Joy:** 

### 💫 Daily Affirmation
*I am showing up today with calm presence and courage.*
`,
  },
  {
    id: 'stoic-evening-review',
    name: 'Stoic Evening Review',
    description: 'End the day with thoughtful self-inquiry on actions, emotions, and virtues.',
    emoji: '🌙',
    category: 'Philosophy',
    mood: 'calm',
    defaultTags: ['Evening', 'Stoicism', 'Reflection'],
    titleSuggestion: 'Evening Self-Examination',
    structure: `### ⚖️ Evening Audit
- **What did I do well today?**
  
- **Where did I falter or lose my center?**
  
- **What could I have handled with more grace or patience?**
  

### 🌿 Lesson for Tomorrow
*What wisdom am I taking into the morning?*
`,
  },
  {
    id: 'cbt-thought-record',
    name: 'CBT Thought Record',
    description: 'Untangle anxious thoughts, spot cognitive distortions, and regain clarity.',
    emoji: '🧠',
    category: 'Mindfulness',
    mood: 'reflective',
    defaultTags: ['CBT', 'Clarity', 'Mindset'],
    titleSuggestion: 'Deconstructing Anxious Thought',
    structure: `### 🔍 The Situation
*What triggered the distress or racing thoughts?*


### ⚡ The Automatic Thought & Emotion
- **Thought:** 
- **Emotion (0-100%):** 

### 🔎 Evidence & Distortions
- **Evidence supporting the thought:** 
- **Evidence against the thought:** 
- **Distortion spotted:** *(e.g. Catastrophizing, Black-and-white, Mind-reading)*

### 🕊️ Balanced Perspective
*What is a compassionate, realistic way to view this situation?*
`,
  },
  {
    id: 'gratitude-trio',
    name: 'Gratitude Trio',
    description: 'Savor one person, one sensory experience, and one small unexpected delight.',
    emoji: '🌿',
    category: 'Wellbeing',
    mood: 'grateful',
    defaultTags: ['Gratitude', 'Savoring'],
    titleSuggestion: 'Savoring the Good',
    structure: `### 👤 A Person I am Thankful For
*Who supported, listened, or brought kindness to my life recently?*


### ☕ A Sensory Delight
*A taste, sound, texture, or scent that felt deeply comforting today:*


### 🎁 An Unexpected Gift
*A small surprise, coincidence, or moment of grace:*
`,
  },
  {
    id: 'weekly-synthesis',
    name: 'Weekly Brain Dump & Review',
    description: 'Step back to review progress, celebrate wins, and clear mental tabs.',
    emoji: '🚀',
    category: 'Planning',
    mood: 'inspired',
    defaultTags: ['Weekly Review', 'Growth'],
    titleSuggestion: 'Weekly Retrospective & Reset',
    structure: `### 🏆 Top 3 Highlights & Wins
1. 
2. 
3. 

### 🧗 What Challenged Me?
*What took more energy than expected, and what did it teach me?*


### 🧹 Mental Clutter / Brain Dump
*Things bouncing around in my head that I need to capture:*
- 

### 🧭 The One Big Anchor for Next Week
*If I only accomplish one meaningful thing next week, it will be:*
`,
  },
];
