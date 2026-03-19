/**
 * Daily Insights Engine
 * Combines Chinese Zodiac, Western Astrology, and Solar Terms
 * for personalized actionable guidance
 */

// ==================== Chinese Zodiac ====================
const CHINESE_ZODIAC = [
  {
    name: 'Rat', emoji: '🐀', 
    traits: ['Intelligent', 'Adaptable', 'Quick-witted'],
    element: 'Water',
    luckyNumbers: [2, 3],
    personality: 'resourceful and versatile'
  },
  {
    name: 'Ox', emoji: '🐂',
    traits: ['Diligent', 'Dependable', 'Strong'],
    element: 'Earth',
    luckyNumbers: [1, 4],
    personality: 'hardworking and reliable'
  },
  {
    name: 'Tiger', emoji: '🐅',
    traits: ['Brave', 'Confident', 'Competitive'],
    element: 'Wood',
    luckyNumbers: [1, 3, 4],
    personality: 'courageous and ambitious'
  },
  {
    name: 'Rabbit', emoji: '🐰',
    traits: ['Gentle', 'Elegant', 'Responsible'],
    element: 'Wood',
    luckyNumbers: [3, 4, 9],
    personality: 'kind and compassionate'
  },
  {
    name: 'Dragon', emoji: '🐉',
    traits: ['Confident', 'Intelligent', 'Enthusiastic'],
    element: 'Earth',
    luckyNumbers: [1, 6, 7],
    personality: 'charismatic and powerful'
  },
  {
    name: 'Snake', emoji: '🐍',
    traits: ['Wise', 'Enigmatic', 'Intuitive'],
    element: 'Fire',
    luckyNumbers: [2, 8, 9],
    personality: 'mysterious and thoughtful'
  },
  {
    name: 'Horse', emoji: '🐴',
    traits: ['Animated', 'Active', 'Energetic'],
    element: 'Fire',
    luckyNumbers: [2, 3, 7],
    personality: 'free-spirited and energetic'
  },
  {
    name: 'Goat', emoji: '🐐',
    traits: ['Calm', 'Gentle', 'Creative'],
    element: 'Earth',
    luckyNumbers: [3, 4, 9],
    personality: 'artistic and peaceful'
  },
  {
    name: 'Monkey', emoji: '🐵',
    traits: ['Sharp', 'Smart', 'Curious'],
    element: 'Metal',
    luckyNumbers: [4, 9],
    personality: 'clever and inventive'
  },
  {
    name: 'Rooster', emoji: '🐓',
    traits: ['Observant', 'Hardworking', 'Courageous'],
    element: 'Metal',
    luckyNumbers: [5, 7, 8],
    personality: 'confident and honest'
  },
  {
    name: 'Dog', emoji: '🐕',
    traits: ['Lovely', 'Honest', 'Prudent'],
    element: 'Earth',
    luckyNumbers: [3, 4, 9],
    personality: 'loyal and sincere'
  },
  {
    name: 'Pig', emoji: '🐖',
    traits: ['Compassionate', 'Generous', 'Diligent'],
    element: 'Water',
    luckyNumbers: [2, 5, 8],
    personality: 'kind and optimistic'
  }
];

// ==================== Western Zodiac ====================
const WESTERN_ZODIAC = [
  {
    name: 'Aries', emoji: '♈', symbol: '🔥',
    dates: [3, 21, 4, 19],
    element: 'Fire',
    traits: ['Bold', 'Ambitious', 'Passionate'],
    strength: 'leadership and initiative'
  },
  {
    name: 'Taurus', emoji: '♉', symbol: '🌱',
    dates: [4, 20, 5, 20],
    element: 'Earth',
    traits: ['Reliable', 'Patient', 'Practical'],
    strength: 'stability and determination'
  },
  {
    name: 'Gemini', emoji: '♊', symbol: '💨',
    dates: [5, 21, 6, 20],
    element: 'Air',
    traits: ['Versatile', 'Communicative', 'Witty'],
    strength: 'adaptability and communication'
  },
  {
    name: 'Cancer', emoji: '♋', symbol: '🌊',
    dates: [6, 21, 7, 22],
    element: 'Water',
    traits: ['Intuitive', 'Emotional', 'Protective'],
    strength: 'empathy and nurturing'
  },
  {
    name: 'Leo', emoji: '♌', symbol: '🦁',
    dates: [7, 23, 8, 22],
    element: 'Fire',
    traits: ['Creative', 'Generous', 'Warm-hearted'],
    strength: 'confidence and creativity'
  },
  {
    name: 'Virgo', emoji: '♍', symbol: '🌾',
    dates: [8, 23, 9, 22],
    element: 'Earth',
    traits: ['Analytical', 'Practical', 'Meticulous'],
    strength: 'attention to detail'
  },
  {
    name: 'Libra', emoji: '♎', symbol: '⚖️',
    dates: [9, 23, 10, 22],
    element: 'Air',
    traits: ['Diplomatic', 'Gracious', 'Fair-minded'],
    strength: 'balance and harmony'
  },
  {
    name: 'Scorpio', emoji: '♏', symbol: '🦂',
    dates: [10, 23, 11, 21],
    element: 'Water',
    traits: ['Passionate', 'Resourceful', 'Brave'],
    strength: 'intensity and transformation'
  },
  {
    name: 'Sagittarius', emoji: '♐', symbol: '🏹',
    dates: [11, 22, 12, 21],
    element: 'Fire',
    traits: ['Optimistic', 'Freedom-loving', 'Philosophical'],
    strength: 'wisdom and adventure'
  },
  {
    name: 'Capricorn', emoji: '♑', symbol: '🏔️',
    dates: [12, 22, 1, 19],
    element: 'Earth',
    traits: ['Responsible', 'Disciplined', 'Ambitious'],
    strength: 'perseverance and ambition'
  },
  {
    name: 'Aquarius', emoji: '♒', symbol: '💧',
    dates: [1, 20, 2, 18],
    element: 'Air',
    traits: ['Progressive', 'Original', 'Independent'],
    strength: 'innovation and humanitarianism'
  },
  {
    name: 'Pisces', emoji: '♓', symbol: '🐟',
    dates: [2, 19, 3, 20],
    element: 'Water',
    traits: ['Compassionate', 'Artistic', 'Intuitive'],
    strength: 'imagination and empathy'
  }
];

// ==================== Solar Terms ====================
const SOLAR_TERMS = [
  { name: 'Spring Begins', emoji: '🌱', season: 'Spring', energy: 'renewal' },
  { name: 'Rain Water', emoji: '🌧️', season: 'Spring', energy: 'growth' },
  { name: 'Awakening', emoji: '🌿', season: 'Spring', energy: 'vitality' },
  { name: 'Spring Equinox', emoji: '🌸', season: 'Spring', energy: 'balance' },
  { name: 'Clear Brightness', emoji: '☀️', season: 'Spring', energy: 'clarity' },
  { name: 'Grain Rain', emoji: '🌾', season: 'Spring', energy: 'nourishment' },
  { name: 'Summer Begins', emoji: '🌻', season: 'Summer', energy: 'expansion' },
  { name: 'Grain Buds', emoji: '🌼', season: 'Summer', energy: 'abundance' },
  { name: 'Grain in Ear', emoji: '🌾', season: 'Summer', energy: 'productivity' },
  { name: 'Summer Solstice', emoji: '🔆', season: 'Summer', energy: 'peak' },
  { name: 'Slight Heat', emoji: '🌡️', season: 'Summer', energy: 'warmth' },
  { name: 'Great Heat', emoji: '☀️', season: 'Summer', energy: 'intensity' },
  { name: 'Autumn Begins', emoji: '🍂', season: 'Autumn', energy: 'harvest' },
  { name: 'End of Heat', emoji: '🍁', season: 'Autumn', energy: 'cooling' },
  { name: 'White Dew', emoji: '💧', season: 'Autumn', energy: 'reflection' },
  { name: 'Autumn Equinox', emoji: '🌾', season: 'Autumn', energy: 'equilibrium' },
  { name: 'Cold Dew', emoji: '🌫️', season: 'Autumn', energy: 'preparation' },
  { name: 'Frost Descent', emoji: '❄️', season: 'Autumn', energy: 'transition' },
  { name: 'Winter Begins', emoji: '🌨️', season: 'Winter', energy: 'rest' },
  { name: 'Light Snow', emoji: '🌨️', season: 'Winter', energy: 'quietude' },
  { name: 'Heavy Snow', emoji: '❄️', season: 'Winter', energy: 'stillness' },
  { name: 'Winter Solstice', emoji: '🌑', season: 'Winter', energy: 'introspection' },
  { name: 'Slight Cold', emoji: '🧊', season: 'Winter', energy: 'resilience' },
  { name: 'Great Cold', emoji: '❄️', season: 'Winter', energy: 'endurance' }
];

// ==================== Calculation Functions ====================

export function getChineseZodiac(year) {
  const baseYear = 1900; // Rat year
  const index = (year - baseYear) % 12;
  return CHINESE_ZODIAC[index];
}

export function getWesternZodiac(month, day) {
  for (const sign of WESTERN_ZODIAC) {
    const [startMonth, startDay, endMonth, endDay] = sign.dates;
    
    if (month === startMonth && day >= startDay) {
      return sign;
    }
    if (month === endMonth && day <= endDay) {
      return sign;
    }
  }
  return WESTERN_ZODIAC[0]; // Fallback
}

export function getSolarTerm(date) {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Simplified solar term calculation
  const termIndex = Math.floor((month * 2) + (day > 15 ? 1 : 0));
  return SOLAR_TERMS[termIndex % 24];
}

export function getSeason(date) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

// ==================== Insight Generation ====================

export class InsightsEngine {
  constructor(birthDate, focusAreas, timezone = 'UTC') {
    this.birthDate = new Date(birthDate);
    this.today = new Date();
    this.focusAreas = focusAreas;
    this.timezone = timezone;
    
    // Calculate cosmic profile
    this.zodiac = getChineseZodiac(this.birthDate.getFullYear());
    this.sign = getWesternZodiac(this.birthDate.getMonth() + 1, this.birthDate.getDate());
    this.solarTerm = getSolarTerm(this.today);
    this.season = getSeason(this.today);
    
    // Generate unique seed based on date and birth info
    this.seed = this.generateSeed();
  }
  
  generateSeed() {
    const dateStr = this.today.toISOString().split('T')[0];
    const birthStr = this.birthDate.toISOString().split('T')[0];
    return `${dateStr}-${birthStr}`;
  }
  
  // Pseudo-random number generator with seed
  seededRandom(index = 0) {
    const str = this.seed + index;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100) / 100;
  }
  
  getProfile() {
    return {
      zodiac: this.zodiac,
      sign: this.sign,
      solarTerm: this.solarTerm,
      season: this.season,
      element: this.zodiac.element,
      traits: [...this.zodiac.traits, ...this.sign.traits],
      luckyNumbers: this.zodiac.luckyNumbers
    };
  }
  
  generateInsights() {
    const insights = [];
    
    for (const area of this.focusAreas) {
      insights.push(this.generateInsightForArea(area));
    }
    
    return insights;
  }
  
  generateInsightForArea(area) {
    const templates = INSIGHT_TEMPLATES[area];
    const random = this.seededRandom(area.length);
    const templateIndex = Math.floor(random * templates.length);
    const template = templates[templateIndex];
    
    // Generate personalized content
    const insight = this.personalizeInsight(template, area);
    
    return {
      area,
      ...insight,
      tags: this.generateTags(area),
      timestamp: this.today.toISOString()
    };
  }
  
  personalizeInsight(template, area) {
    const context = {
      zodiac: this.zodiac.name,
      zodiacTrait: this.zodiac.traits[0],
      sign: this.sign.name,
      signTrait: this.sign.traits[0],
      element: this.zodiac.element,
      season: this.season,
      solarTerm: this.solarTerm.name,
      energy: this.solarTerm.energy,
      luckyNumber: this.zodiac.luckyNumbers[0]
    };
    
    // Replace placeholders
    let message = template.message;
    let action = template.action;
    
    Object.keys(context).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), context[key]);
      action = action.replace(new RegExp(placeholder, 'g'), context[key]);
    });
    
    return {
      title: template.title,
      message,
      action,
      icon: AREA_ICONS[area]
    };
  }
  
  generateTags(area) {
    const baseTags = [this.zodiac.name, this.sign.name, this.season];
    const areaTags = AREA_TAGS[area];
    return [...baseTags, ...areaTags].slice(0, 5);
  }
}

// ==================== Area Icons ====================
const AREA_ICONS = {
  career: '💼',
  education: '📚',
  wealth: '💰',
  love: '❤️',
  health: '🏃',
  mindset: '🧘'
};

// ==================== Area Tags ====================
const AREA_TAGS = {
  career: ['Professional', 'Growth', 'Ambition'],
  education: ['Learning', 'Knowledge', 'Skills'],
  wealth: ['Prosperity', 'Finance', 'Abundance'],
  love: ['Relationships', 'Connection', 'Harmony'],
  health: ['Wellness', 'Energy', 'Vitality'],
  mindset: ['Peace', 'Balance', 'Clarity']
};

// ==================== Insight Templates ====================
const INSIGHT_TEMPLATES = {
  career: [
    {
      title: 'Professional Breakthrough',
      message: 'As a {zodiac} with {sign} influence, your {zodiacTrait} nature aligns perfectly with the {energy} energy of {solarTerm}. This is an opportune time to showcase your leadership abilities.',
      action: 'Schedule a meeting with your supervisor to discuss a project you\'ve been passionate about. Prepare a 3-point proposal highlighting your unique contributions and present it confidently before Friday.'
    },
    {
      title: 'Networking Opportunity',
      message: 'The {element} element of your {zodiac} sign resonates with collaborative energy today. Your {signTrait} qualities will help you make meaningful connections.',
      action: 'Reach out to 2-3 colleagues you admire but haven\'t spoken with recently. Send a personalized message asking about their current projects and offer your perspective or assistance.'
    },
    {
      title: 'Skill Development Focus',
      message: 'During this {season} period, your {sign} analytical strengths are heightened. The cosmic alignment favors learning and skill refinement.',
      action: 'Dedicate 30 minutes today to learning one specific skill related to your career goals. Choose a tutorial, complete one module, and apply it to a real work scenario by week\'s end.'
    },
    {
      title: 'Strategic Planning',
      message: 'Your {zodiac} wisdom combined with {sign}\'s {signTrait} approach creates perfect conditions for long-term planning during {solarTerm}.',
      action: 'Block 1 hour this week to map out your next 90-day career goals. Write down 3 specific milestones and identify one action for each that you can start tomorrow.'
    }
  ],
  
  education: [
    {
      title: 'Learning Momentum',
      message: 'The {energy} energy of {solarTerm} amplifies your natural {zodiacTrait} curiosity as a {zodiac}. Your {sign} mind is particularly receptive to new information.',
      action: 'Choose one topic you\'ve been curious about and spend 25 minutes today exploring it through 2-3 quality sources. Take notes and discuss what you learned with someone by tomorrow.'
    },
    {
      title: 'Study Strategy',
      message: 'As a {zodiac} influenced by {sign}, your learning style benefits from {element} element\'s grounding during this {season} season.',
      action: 'Reorganize your study space today: Remove 3 distractions, add one inspiring element, and create a specific 2-hour study block for this week with clear start/end times.'
    },
    {
      title: 'Knowledge Sharing',
      message: 'Your {zodiac} generosity and {sign}\'s {signTrait} nature make this ideal for teaching others what you know during {solarTerm}.',
      action: 'Identify one concept you\'ve mastered recently. Create a simple 5-minute explanation and share it with a study group, colleague, or online community within 48 hours.'
    },
    {
      title: 'Deep Focus',
      message: 'The {season} season\'s {energy} energy complements your {zodiac} determination. Your {sign} concentration powers are at their peak.',
      action: 'Select your most challenging subject and dedicate one uninterrupted 45-minute session to it today. Use the Pomodoro technique: 45 minutes focus, 15 minutes rest, then review your progress.'
    }
  ],
  
  wealth: [
    {
      title: 'Financial Clarity',
      message: 'Your {zodiac} practical nature aligns with {sign}\'s {signTrait} approach to resources. The {energy} of {solarTerm} brings financial awareness.',
      action: 'Review your last 30 days of expenses today. Identify 3 recurring costs and evaluate if each brings proportional value. Cancel or reduce one unnecessary subscription before this weekend.'
    },
    {
      title: 'Income Opportunity',
      message: 'As a {zodiac} with {sign} creativity, the {season} season opens doors for monetizing your skills. Your lucky number {luckyNumber} may bring opportunities.',
      action: 'List 3 skills you possess that others find valuable. Research one platform where you could offer these services. Set up a basic profile and list one service offering within 72 hours.'
    },
    {
      title: 'Savings Strategy',
      message: 'The {element} element influences your {zodiac} approach to security. {solarTerm}\'s {energy} energy supports building financial reserves.',
      action: 'Calculate 10% of your current monthly income. Set up an automatic transfer to a separate savings account for this amount, scheduled to occur on your next payday.'
    },
    {
      title: 'Investment Wisdom',
      message: 'Your {sign} {signTrait} judgment combined with {zodiac} intuition creates favorable conditions for financial planning during this {season} period.',
      action: 'Spend 30 minutes researching one investment vehicle you\'re curious about (index funds, real estate, skills training). Write down 3 specific questions and consult a financial advisor this month.'
    }
  ],
  
  love: [
    {
      title: 'Relationship Deepening',
      message: 'Your {zodiac} {zodiacTrait} heart resonates with {sign}\'s capacity for connection. The {energy} of {solarTerm} favors authentic communication.',
      action: 'Initiate a meaningful conversation with your partner or close friend today. Ask them one specific question about their dreams or challenges, then listen without interrupting for 10 minutes.'
    },
    {
      title: 'Self-Love Practice',
      message: 'As a {zodiac} influenced by {sign}, the {season} season reminds you that loving yourself is the foundation of all relationships.',
      action: 'Write down 5 things you appreciate about yourself today. Choose one and do something that honors that quality - take yourself on a solo date, treat yourself, or share your talent.'
    },
    {
      title: 'Social Connection',
      message: 'Your {zodiac} social energy and {sign}\'s {signTrait} nature create perfect conditions for expanding your circle during {solarTerm}.',
      action: 'Reach out to one person you\'ve been meaning to connect with. Suggest a specific activity - coffee, walk, or video call - and set a date within the next 7 days.'
    },
    {
      title: 'Emotional Expression',
      message: 'The {element} element of your {zodiac} sign encourages authentic emotional expression. Your {sign} sensitivity is heightened in this {season} period.',
      action: 'Write a heartfelt message to someone important in your life. Be specific about one way they\'ve positively impacted you. Send it today without overthinking - authenticity matters more than perfection.'
    }
  ],
  
  health: [
    {
      title: 'Energy Optimization',
      message: 'Your {zodiac} vitality thrives during {solarTerm}. The {energy} energy of this period supports physical renewal, enhanced by your {sign} awareness.',
      action: 'Set a timer for 7 minutes right now. Do a simple movement practice: 2 minutes stretching, 3 minutes cardio (jumping jacks, stairs), 2 minutes deep breathing. Repeat daily this week at the same time.'
    },
    {
      title: 'Nutrition Focus',
      message: 'As a {zodiac} with {sign} mindfulness, the {season} season calls for nourishing your body with intention and care.',
      action: 'Plan your next 3 meals including one vegetable you don\'t usually eat and one lean protein source. Prep ingredients tonight so healthy choices are the easiest option tomorrow.'
    },
    {
      title: 'Rest and Recovery',
      message: 'Your {zodiac} energy needs balance. The {energy} quality of {solarTerm} reminds you that rest is productive, especially with your {sign} tendency to push hard.',
      action: 'Establish a 30-minute wind-down routine starting 1 hour before bed tonight: No screens, dim lights, gentle stretching or reading. Commit to this for 3 consecutive nights.'
    },
    {
      title: 'Mind-Body Connection',
      message: 'The {element} element of your {zodiac} nature seeks harmony. Your {sign} intuition can guide you to what your body truly needs during this {season} period.',
      action: 'Spend 5 minutes in quiet sitting today. Notice 3 physical sensations without judgment. Based on what you observe, choose one small action to address your body\'s needs within 24 hours.'
    }
  ],
  
  mindset: [
    {
      title: 'Mental Clarity',
      message: 'Your {zodiac} {zodiacTrait} mind aligns beautifully with {sign}\'s contemplative nature. The {energy} of {solarTerm} brings mental spaciousness.',
      action: 'Start a 5-minute morning meditation practice today. Sit quietly, focus on your breath, and when thoughts arise, simply notice them and return to breathing. Do this for 7 consecutive days.'
    },
    {
      title: 'Perspective Shift',
      message: 'As a {zodiac} influenced by {sign}, the {season} season invites you to see challenges as growth opportunities through your {signTrait} lens.',
      action: 'Identify one current challenge. Write down 3 potential lessons or skills this situation is teaching you. Choose one and actively practice that skill today in a different context.'
    },
    {
      title: 'Gratitude Practice',
      message: 'Your {zodiac} appreciation for life deepens during {solarTerm}. The {element} element grounds your {sign} awareness in the present moment.',
      action: 'Before bed tonight, write down 3 specific things that went well today and why they happened. Be detailed - instead of "good meeting," write "productive meeting because I prepared 3 questions."'
    },
    {
      title: 'Inner Peace',
      message: 'The {energy} quality of this {season} period supports your {zodiac} quest for balance. Your {sign} wisdom knows that peace begins within.',
      action: 'Create a personal sanctuary in one corner of your space. Add 3 elements that bring you calm. Spend 10 minutes there today without your phone, just being present with yourself.'
    }
  ]
};

export { CHINESE_ZODIAC, WESTERN_ZODIAC, SOLAR_TERMS };


