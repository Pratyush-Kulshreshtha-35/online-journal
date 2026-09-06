import { JournalEntry, MoodType, LocationTag, WeatherStamp } from '../types/journal';

export interface SampleEntryTemplate {
  dayOffset: number; // Days in the past (0 = today, 1 = yesterday, etc.)
  title: string;
  content: string;
  mood: MoodType;
  tags: string[];
  isFavorite?: boolean;
  location?: LocationTag;
  weather?: WeatherStamp;
}

export const SAMPLE_JOURNAL_TEMPLATES: SampleEntryTemplate[] = [
  {
    dayOffset: 0,
    title: 'Morning Stillness Before the City Awakens',
    content: `The sky is a soft lilac gray today. Sat with my first cup of pour-over coffee for twenty uninterrupted minutes, just watching the steam curl against the window pane.

There is a distinct quietness to early mornings that resets my nervous system. I am reminding myself that I do not need to rush headlong into the day's expectations. Peace is not something to be earned after exhausting yourself; it is the space from which good work flows.`,
    mood: 'calm',
    tags: ['Morning', 'Stillness', 'Coffee', 'Mindfulness'],
    isFavorite: true,
    location: {
      placeName: 'Home Balcony Sanctuary, San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
      country: 'United States',
    },
    weather: {
      temperatureC: 16,
      temperatureF: 61,
      condition: 'Misty Overcast',
      icon: 'cloud',
      humidity: 78,
      windSpeedKmh: 12,
    },
  },
  {
    dayOffset: 1,
    title: 'Sudden Breakthrough on the Core Architecture',
    content: `Everything clicked this afternoon. What felt like an insurmountable bottleneck for three days suddenly simplified into a clean, decoupled pattern.

Spent three hours in deep flow with headphones on and ambient rain sounds playing. It's exhilarating when your intuition catches up to a problem before your conscious mind finishes analyzing it. Feeling invigorated to build tomorrow!`,
    mood: 'energized',
    tags: ['Work', 'Breakthrough', 'Flow', 'Code'],
    isFavorite: false,
    location: {
      placeName: 'Dolores Park Cafe, Mission District',
      latitude: 37.7596,
      longitude: -122.4271,
      city: 'San Francisco',
      country: 'United States',
    },
    weather: {
      temperatureC: 22,
      temperatureF: 72,
      condition: 'Sunny & Clear',
      icon: 'sun',
      humidity: 48,
      windSpeedKmh: 14,
    },
  },
  {
    dayOffset: 2,
    title: 'Evening Walk & Golden Hour Shadows',
    content: `Walked the long way through the park as the golden hour light filtered through the cedar trees. The air had that cool early-September crispness that always signals change.

Thought about how much has shifted over the past year. Sometimes you don't notice growth because you're standing too close to your own mirror. Today, I stepped back and appreciated the distance traveled.`,
    mood: 'reflective',
    tags: ['Nature', 'Walking', 'Reflection', 'Gratitude'],
    isFavorite: false,
    location: {
      placeName: 'Golden Gate Park Conservatory',
      latitude: 37.7701,
      longitude: -122.4604,
      city: 'San Francisco',
      country: 'United States',
    },
    weather: {
      temperatureC: 18,
      temperatureF: 64,
      condition: 'Golden Hour Dusk',
      icon: 'cloud-sun',
      humidity: 60,
      windSpeedKmh: 9,
    },
  },
  {
    dayOffset: 3,
    title: 'A Rush of Inspiration for a Creative Essay',
    content: `Jotted down four pages of rough notes about the relationship between analog tools and human presence. Why does writing with a fountain pen feel so fundamentally different than tapping on glass?

The words flowed effortlessly. I want to flesh this into a longer essay about digital intentionality. Ideas like this feel like gifts—you have to capture them while they are still glowing.`,
    mood: 'inspired',
    tags: ['Writing', 'Creativity', 'Ideas', 'Essays'],
    isFavorite: true,
    location: {
      placeName: 'City Lights Bookstore, North Beach',
      latitude: 37.7976,
      longitude: -122.4066,
      city: 'San Francisco',
      country: 'United States',
    },
    weather: {
      temperatureC: 19,
      temperatureF: 66,
      condition: 'Partly Cloudy',
      icon: 'cloud-sun',
      humidity: 55,
      windSpeedKmh: 11,
    },
  },
  {
    dayOffset: 4,
    title: 'Laughter Around an Unhurried Dinner Table',
    content: `Cooked handmade pasta with Maya and Julian tonight. We ended up lingering at the table until nearly eleven, laughing until our stomachs hurt over stories from college.

In a world obsessed with productivity metrics, hours spent in warmth and camaraderie are the true wealth. My heart feels overflowing with simple joy.`,
    mood: 'joyful',
    tags: ['Friends', 'Connection', 'Dinner', 'Joy'],
    isFavorite: false,
    location: {
      placeName: 'Chez Panisse Garden, Berkeley',
      latitude: 37.8796,
      longitude: -122.2690,
      city: 'Berkeley',
      country: 'United States',
    },
    weather: {
      temperatureC: 20,
      temperatureF: 68,
      condition: 'Starlit Evening',
      icon: 'moon',
      humidity: 50,
      windSpeedKmh: 6,
    },
  },
  {
    dayOffset: 5,
    title: 'Lazy Sunday Afternoon & Chapter Four',
    content: `Spent most of the afternoon curled up in the armchair reading. The rain gently tapped on the skylight, providing a natural metronome.

Made a pot of chamomile tea and let the hours dissolve without guilt. Rest is not empty time; it is fertile ground.`,
    mood: 'calm',
    tags: ['Reading', 'Tea', 'Sunday', 'Cozy'],
    isFavorite: true,
    location: {
      placeName: 'Kyoto Machiya Teahouse Sanctuary',
      latitude: 35.0037,
      longitude: 135.7681,
      city: 'Kyoto',
      country: 'Japan',
    },
    weather: {
      temperatureC: 17,
      temperatureF: 63,
      condition: 'Gentle Rain',
      icon: 'cloud-rain',
      humidity: 82,
      windSpeedKmh: 8,
    },
  },
  {
    dayOffset: 6,
    title: 'Tight Chest & Compounding Deadlines',
    content: `Felt a familiar tightness in my chest when I opened my inbox this morning. Too many concurrent requests pulling in opposite directions.

Had to step away at 3 PM and practice box breathing for ten minutes. Reminding myself: urgency is often an illusion manufactured by other people's poor planning. One step at a time. What is the single most important task right now?`,
    mood: 'anxious',
    tags: ['Stress', 'Work', 'Breathwork', 'Anxiety'],
    isFavorite: false,
  },
  {
    dayOffset: 7,
    title: 'Finding Equanimity After the Storm',
    content: `Managed to resolve the client misunderstanding today with a candid 15-minute phone call. Funny how things that loom so large in anticipation dissolve so quickly in direct conversation.

The anxiety from yesterday has melted away, leaving a calm, steady resolve. Progress is made in honest dialogues.`,
    mood: 'calm',
    tags: ['Resolution', 'Peace', 'Communication'],
    isFavorite: false,
  },
  {
    dayOffset: 8,
    title: 'Counting the Quiet Blessings',
    content: `Three things I am deeply grateful for today:
1. Warm wool socks on a chilly morning.
2. The kind note an old colleague sent out of the blue.
3. Good health and lungs that breathe without struggle.

Gratitude turns what we have into enough.`,
    mood: 'grateful',
    tags: ['Gratitude', 'Perspective', 'Simplicity'],
    isFavorite: false,
  },
  {
    dayOffset: 10,
    title: 'Heavy Fog and Melancholy Tones',
    content: `The fog didn't lift all day. Felt a low, quiet melancholy humming in the background. Not necessarily sadness—more like an emotional autumn, a shedding of leaves.

Allowed myself to feel it without trying to artificially 'fix' my mood with distractions. Sometimes the soul simply needs an overcast day.`,
    mood: 'melancholy',
    tags: ['Mood', 'Melancholy', 'Quiet', 'Solitude'],
    isFavorite: false,
  },
  {
    dayOffset: 11,
    title: 'Clearing the Mental Clutter on the Trail',
    content: `Hiked the ridge trail after lunch. The physical exertion burned off the lingering fog in my head. Looking out over the valley always restores my sense of proportion.

We are so small in the grand architecture of things, and that insignificance is strangely liberating.`,
    mood: 'reflective',
    tags: ['Hiking', 'Nature', 'Perspective', 'Clarity'],
    isFavorite: false,
  },
  {
    dayOffset: 13,
    title: 'Rediscovering the Acoustic Guitar',
    content: `Tuned the acoustic guitar that had been collecting dust in the corner for months. Fingers were clumsy at first, but within twenty minutes Muscle memory kicked in.

Played through old songs by Nick Drake and Iron & Wine. Music taps into an emotional reservoir that spoken words can never quite reach. Feeling renewed.`,
    mood: 'inspired',
    tags: ['Music', 'Guitar', 'Creativity', 'Joy'],
    isFavorite: false,
  },
  {
    dayOffset: 14,
    title: 'Shipped the Product Release & Celebrated!',
    content: `We officially deployed version 2.0 at 4 PM! Six months of meticulous work, late nights, and refactoring culminated in a flawless deployment without a single error alert.

High fives in the team channel, toasts with sparkling cider. It is deeply gratifying to pour your craft into something and watch real users delight in it. Pure joy!`,
    mood: 'joyful',
    tags: ['Launch', 'Milestone', 'Team', 'Celebration'],
    isFavorite: true,
  },
  {
    dayOffset: 15,
    title: 'Post-Launch High Energy & Momentum',
    content: `Riding the momentum of yesterday's successful launch. Drafted the roadmap for Q4 and tackled several backlog items with speed and precision.

When energy is high, strike while the iron is hot. Getting things done feels as natural as breathing today.`,
    mood: 'energized',
    tags: ['Productivity', 'Momentum', 'Goals'],
    isFavorite: false,
  },
  {
    dayOffset: 17,
    title: 'Restless Thoughts at 2 AM',
    content: `Woke up in the middle of the night with racing thoughts about financial planning and long-term security. The mind loves to invent catastrophes in the dark.

Got out of bed, drank warm water, and wrote this entry to externalize the racing thoughts. Once thoughts are on paper, they lose their spectral power over you.`,
    mood: 'anxious',
    tags: ['Insomnia', 'Anxiety', 'Night', 'Release'],
    isFavorite: false,
  },
  {
    dayOffset: 18,
    title: 'Morning Sun and Deep Relief',
    content: `The anxieties of 2 AM always look so absurd when viewed under direct morning sunlight. Had a great breakfast, spoke with my mentor, and mapped out a sensible monthly budget.

Feeling profoundly grateful for perspective and resilience. Every sunrise is a clean slate.`,
    mood: 'grateful',
    tags: ['Gratitude', 'Morning', 'Reset', 'Peace'],
    isFavorite: false,
  },
  {
    dayOffset: 20,
    title: 'A Quiet Afternoon of Research & Reflection',
    content: `Spent three hours reading Marcus Aurelius's Meditations and Seneca's letters. Stoic wisdom has a clarifying astringency.

'You have power over your mind—not outside events. Realize this, and you will find strength.' Letting go of things I cannot control brings instant calmness.`,
    mood: 'calm',
    tags: ['Philosophy', 'Stoicism', 'Reading', 'Wisdom'],
    isFavorite: true,
  },
  {
    dayOffset: 22,
    title: 'Bittersweet Memories of Childhood Summers',
    content: `Looked through an old photo album my mother brought over. Pictures from twenty years ago on the lake. Everyone looks so young, and some of the faces are no longer with us.

A tender ache in the chest. Life moves with such terrifying swiftness. Cherish the present moments while they are still in your hands.`,
    mood: 'melancholy',
    tags: ['Memory', 'Family', 'Nostalgia', 'Tender'],
    isFavorite: false,
  },
  {
    dayOffset: 24,
    title: 'An Inspired Morning Sketching New Concepts',
    content: `Woke up early with a vivid vision for a minimalist UI concept. Replaced all bloated controls with clean typographic hierarchies and warm, tactile neutrals.

Creating for the sheer joy of creating is the purest form of play.`,
    mood: 'inspired',
    tags: ['Design', 'Inspiration', 'UI', 'Craft'],
    isFavorite: false,
  },
  {
    dayOffset: 26,
    title: 'Double Shot Espresso & Grand Ambitions',
    content: `Wrote down five ambitious goals for the coming year. When you break big dreams into daily non-negotiable rituals, fear transforms into focused determination.

Ready to put in the deliberate practice required. Let's make it happen.`,
    mood: 'energized',
    tags: ['Vision', 'Ambition', 'Goals', 'Discipline'],
    isFavorite: false,
  },
  {
    dayOffset: 28,
    title: 'The Pure Pleasure of Simplicity',
    content: `A simple Saturday: fresh bread from the bakery, farmers market berries, and sitting on a park bench watching dogs play fetch.

No agenda, no meetings, no urgency. Sometimes the best thing you can do for your soul is simply exist without striving.`,
    mood: 'joyful',
    tags: ['Joy', 'Simplicity', 'Saturday', 'Happiness'],
    isFavorite: true,
  },
  {
    dayOffset: 29,
    title: 'Setting Intentions for a New Cycle',
    content: `Beginning a fresh 30-day journaling journey today. My core intentions:
- Write with unvarnished honesty rather than performative eloquence.
- Pay closer attention to small, daily wonders.
- Welcome every mood—the joyful, the calm, and the heavy—as an honest guest.

The ink is wet, and the page is open.`,
    mood: 'reflective',
    tags: ['Intentions', 'Beginnings', 'Journaling', 'Growth'],
    isFavorite: true,
  },
];

/**
 * Generates an array of populated JournalEntry objects mapped to real dates
 * relative to the current day.
 */
export function generateSample30DayEntries(userId: string): JournalEntry[] {
  const now = Date.now();
  const today = new Date();

  return SAMPLE_JOURNAL_TEMPLATES.map((tmpl, index) => {
    const entryDate = new Date(today);
    entryDate.setDate(entryDate.getDate() - tmpl.dayOffset);
    const dateStr = entryDate.toISOString().split('T')[0];

    const words = tmpl.content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Stagger timestamp slightly throughout the day
    const createdAt = entryDate.getTime() + (10 * 3600 * 1000) + (index * 60000);

    return {
      id: `sample_${dateStr}_${index}`,
      userId,
      title: tmpl.title,
      content: tmpl.content,
      mood: tmpl.mood,
      tags: tmpl.tags,
      date: dateStr,
      isFavorite: Boolean(tmpl.isFavorite),
      wordCount,
      readingTime,
      location: tmpl.location,
      weather: tmpl.weather,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
