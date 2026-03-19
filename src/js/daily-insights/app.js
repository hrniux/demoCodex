/**
 * Daily Insights Application
 * Main application logic connecting UI and Insights Engine
 */

import { InsightsEngine } from './insights-engine.js';

// ==================== State Management ====================
let currentInsights = null;
let selectedFocusAreas = [];

// ==================== DOM Elements ====================
const form = document.getElementById('insightForm');
const focusButtons = document.querySelectorAll('.focus-btn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const profileCard = document.getElementById('profileCard');
const insightsGrid = document.getElementById('insightsGrid');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const newBtn = document.getElementById('newBtn');

// ==================== Focus Area Selection ====================
focusButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const focus = btn.dataset.focus;
    
    if (selectedFocusAreas.includes(focus)) {
      // Remove
      selectedFocusAreas = selectedFocusAreas.filter(f => f !== focus);
      btn.classList.remove('active');
    } else {
      // Add (max 3)
      if (selectedFocusAreas.length < 3) {
        selectedFocusAreas.push(focus);
        btn.classList.add('active');
      } else {
        showNotification('Please select maximum 3 focus areas', 'warning');
      }
    }
  });
});

// ==================== Form Submission ====================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const birthDate = document.getElementById('birthDate').value;
  const birthTime = document.getElementById('birthTime').value;
  const timezone = document.getElementById('timezone').value;
  
  if (!birthDate) {
    showNotification('Please enter your birth date', 'error');
    return;
  }
  
  if (selectedFocusAreas.length === 0) {
    showNotification('Please select at least one focus area', 'error');
    return;
  }
  
  // Show loading
  loading.classList.add('active');
  results.classList.remove('active');
  
  // Simulate calculation delay for better UX
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate insights
  try {
    const engine = new InsightsEngine(birthDate, selectedFocusAreas, timezone);
    const profile = engine.getProfile();
    const insights = engine.generateInsights();
    
    currentInsights = {
      profile,
      insights,
      birthDate,
      birthTime,
      timezone,
      generatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Display results
    displayResults(currentInsights);
    
    // Hide loading, show results
    loading.classList.remove('active');
    results.classList.add('active');
    
    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
  } catch (error) {
    console.error('Error generating insights:', error);
    showNotification('Something went wrong. Please try again.', 'error');
    loading.classList.remove('active');
  }
});

// ==================== Display Results ====================
function displayResults(data) {
  displayProfile(data.profile);
  displayInsights(data.insights);
}

function displayProfile(profile) {
  const {zodiac, sign, solarTerm, season, element, traits, luckyNumbers} = profile;
  
  profileCard.innerHTML = `
    <div class="profile-header">
      <div class="profile-icon">${zodiac.emoji}${sign.emoji}</div>
      <div class="profile-info">
        <h2>${zodiac.name} × ${sign.name}</h2>
        <div class="profile-meta">
          <span class="meta-item">${solarTerm.emoji} ${solarTerm.name}</span>
          <span class="meta-item">•</span>
          <span class="meta-item">${season} Season</span>
          <span class="meta-item">•</span>
          <span class="meta-item">${element} Element</span>
        </div>
      </div>
    </div>
    
    <div class="profile-traits">
      <div class="trait-box">
        <div class="trait-label">Core Traits</div>
        <div class="trait-value">${traits.slice(0, 3).join(', ')}</div>
      </div>
      <div class="trait-box">
        <div class="trait-label">Current Energy</div>
        <div class="trait-value">${solarTerm.energy}</div>
      </div>
      <div class="trait-box">
        <div class="trait-label">Lucky Numbers</div>
        <div class="trait-value">${luckyNumbers.join(', ')}</div>
      </div>
      <div class="trait-box">
        <div class="trait-label">Element</div>
        <div class="trait-value">${element}</div>
      </div>
    </div>
  `;
}

function displayInsights(insights) {
  insightsGrid.innerHTML = insights.map(insight => `
    <div class="insight-card">
      <div class="insight-header">
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-title-group">
          <h3>${insight.title}</h3>
          <div class="insight-category">${capitalizeFirst(insight.area)}</div>
        </div>
      </div>
      
      <div class="insight-content">
        <p class="insight-text">${insight.message}</p>
        
        <div class="action-box">
          <div class="action-label">
            <span>⚡</span> Action Step
          </div>
          <div class="action-text">${insight.action}</div>
        </div>
      </div>
      
      <div class="insight-tags">
        ${insight.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ==================== Action Buttons ====================
shareBtn.addEventListener('click', () => {
  if (!currentInsights) return;
  
  const shareText = generateShareText(currentInsights);
  
  if (navigator.share) {
    navigator.share({
      title: 'My Daily Insights',
      text: shareText,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      showNotification('Insights copied to clipboard!', 'success');
    }).catch(() => {
      showNotification('Could not copy to clipboard', 'error');
    });
  }
});

saveBtn.addEventListener('click', () => {
  if (!currentInsights) return;
  
  const dataStr = JSON.stringify(currentInsights, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `daily-insights-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  
  showNotification('Insights saved successfully!', 'success');
});

newBtn.addEventListener('click', () => {
  results.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ==================== Helper Functions ====================
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateShareText(insights) {
  const {profile, insights: insightsList} = insights;
  let text = `✨ My Daily Insights ✨\n\n`;
  text += `${profile.zodiac.emoji} ${profile.zodiac.name} × ${profile.sign.emoji} ${profile.sign.name}\n`;
  text += `Current Energy: ${profile.solarTerm.energy}\n\n`;
  
  insightsList.forEach((insight, index) => {
    text += `${index + 1}. ${insight.icon} ${insight.title}\n`;
    text += `${insight.action}\n\n`;
  });
  
  text += `Get your personalized insights at Daily Insights!`;
  return text;
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==================== Local Storage ====================
function saveToLocalStorage() {
  try {
    localStorage.setItem('dailyInsights', JSON.stringify(currentInsights));
    localStorage.setItem('dailyInsightsDate', new Date().toDateString());
  } catch (e) {
    console.error('Could not save to localStorage:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const savedDate = localStorage.getItem('dailyInsightsDate');
    const today = new Date().toDateString();
    
    // Only load if it's from today
    if (savedDate === today) {
      const saved = localStorage.getItem('dailyInsights');
      if (saved) {
        currentInsights = JSON.parse(saved);
        return currentInsights;
      }
    }
  } catch (e) {
    console.error('Could not load from localStorage:', e);
  }
  return null;
}

// ==================== Initialization ====================
function init() {
  // Set max date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('birthDate').setAttribute('max', today);
  
  // Try to load saved insights
  const saved = loadFromLocalStorage();
  if (saved) {
    // Auto-fill form
    document.getElementById('birthDate').value = saved.birthDate.split('T')[0];
    if (saved.birthTime) {
      document.getElementById('birthTime').value = saved.birthTime;
    }
    
    // Select previous focus areas
    saved.insights.forEach(insight => {
      const btn = document.querySelector(`[data-focus="${insight.area}"]`);
      if (btn && !btn.classList.contains('active')) {
        btn.classList.add('active');
        selectedFocusAreas.push(insight.area);
      }
    });
  }
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize app
init();

// ==================== Easter Egg ====================
console.log('%c✨ Daily Insights ✨', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; color: transparent;');
console.log('%cCombining ancient wisdom with modern technology', 'font-size: 14px; color: #94a3b8;');
console.log('%cMade with ❤️ by DemoCodex', 'font-size: 12px; color: #64748b;');


