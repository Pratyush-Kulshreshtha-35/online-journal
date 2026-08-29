import { MoodConfig, MoodType, DailyPrompt } from '../types/journal';

export const MOODS: Record<MoodType, MoodConfig> = {
  joyful: {
    id: 'joyful',
    label: 'Joyful',
    emoji: '✨',
    bgColor: 'bg-amber-950/40',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-700/50',
    accentDot: 'bg-amber-400',
  },
  grateful: {
    id: 'grateful',
    label: 'Grateful',
    emoji: '🌿',
    bgColor: 'bg-emerald-950/40',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-700/50',
    accentDot: 'bg-emerald-400',
  },
  calm: {
    id: 'calm',
    label: 'Calm',
    emoji: '☁️',
    bgColor: 'bg-sky-950/40',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-700/50',
    accentDot: 'bg-sky-400',
  },
  reflective: {
    id: 'reflective',
    label: 'Reflective',
    emoji: '🕯️',
    bgColor: 'bg-violet-950/40',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-700/50',
    accentDot: 'bg-violet-400',
  },
  energized: {
    id: 'energized',
    label: 'Energized',
    emoji: '⚡',
    bgColor: 'bg-orange-950/40',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-700/50',
    accentDot: 'bg-orange-400',
  },
  inspired: {
    id: 'inspired',
    label: 'Inspired',
    emoji: '💡',
    bgColor: 'bg-yellow-950/40',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-700/50',
    accentDot: 'bg-yellow-400',
  },
  anxious: {
    id: 'anxious',
    label: 'Anxious',
    emoji: '🌊',
    bgColor: 'bg-rose-950/40',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-700/50',
    accentDot: 'bg-rose-400',
  },
  melancholy: {
    id: 'melancholy',
    label: 'Melancholy',
    emoji: '🌧️',
    bgColor: 'bg-stone-900',
    textColor: 'text-stone-300',
    borderColor: 'border-stone-700/50',
    accentDot: 'bg-stone-400',
  },
};

export const DEFAULT_TAGS = [
  'Reflection',
  'Gratitude',
  'Personal Growth',
  'Ideas',
  'Career & Work',
  'Health & Wellness',
  'Relationships',
  'Dreams',
  'Daily Log',
];

export const PROMPTS: DailyPrompt[] = [
  {
    id: 'p-1',
    category: 'Gratitude',
    text: 'What is a small, quiet moment from today that brought you peace?',
    followUp: 'Why did this particular moment stand out to you?',
  },
  {
    id: 'p-2',
    category: 'Reflection',
    text: 'What was the most important decision you made today, and what guided you?',
    followUp: 'Would you make the same choice in hindsight?',
  },
  {
    id: 'p-3',
    category: 'Growth',
    text: 'What is something that felt challenging recently, and what did it teach you about your resilience?',
  },
  {
    id: 'p-4',
    category: 'Mindfulness',
    text: 'Check in with yourself right now: How does your body feel? What thoughts are occupying your mind?',
  },
  {
    id: 'p-5',
    category: 'Creativity',
    text: 'If today had a theme song or title chapter, what would it be and why?',
  },
  {
    id: 'p-6',
    category: 'Gratitude',
    text: 'Who is a person in your life you feel especially grateful for this week?',
    followUp: 'What specific quality about them do you admire most?',
  },
  {
    id: 'p-7',
    category: 'Goals',
    text: 'What is one intentional boundary or habit you want to nurture tomorrow?',
  },
  {
    id: 'p-8',
    category: 'Reflection',
    text: 'What drained your energy today, and what gave you energy back?',
  },
  {
    id: 'p-9',
    category: 'Growth',
    text: 'What is a belief or perspective you have shifted your mind on recently?',
  },
  {
    id: 'p-10',
    category: 'Mindfulness',
    text: 'Describe the weather and sensory atmosphere around you in vivid detail.',
  },
];
