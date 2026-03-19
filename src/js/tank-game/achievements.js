/**
 * 成就系统
 * 追踪玩家的游戏成就和统计数据
 */

export class AchievementManager {
  constructor() {
    this.achievements = {
      firstBlood: { name: '首次击杀', description: '击杀第一个敌人', unlocked: false, icon: '🎯' },
      sharpshooter: { name: '神枪手', description: '单局击杀10个敌人', unlocked: false, icon: '🎖️' },
      survivor: { name: '生存专家', description: '不损失任何生命通过一关', unlocked: false, icon: '🛡️' },
      speedrun: { name: '速度之王', description: '60秒内完成一关', unlocked: false, icon: '⚡' },
      immortal: { name: '不死之身', description: '使用护盾抵挡5次攻击', unlocked: false, icon: '✨' },
      destroyer: { name: '破坏者', description: '摧毁100个砖块', unlocked: false, icon: '💥' },
      veteran: { name: '老兵', description: '累计击杀100个敌人', unlocked: false, icon: '🏆' },
      master: { name: '坦克大师', description: '通过第5关', unlocked: false, icon: '👑' },
      collector: { name: '收藏家', description: '拾取20个道具', unlocked: false, icon: '🎁' },
      perfect: { name: '完美战斗', description: '获得10000分', unlocked: false, icon: '⭐' }
    };
    
    this.stats = {
      totalKills: 0,
      totalDeaths: 0,
      totalShots: 0,
      totalHits: 0,
      blocksDestroyed: 0,
      powerUpsCollected: 0,
      highestLevel: 0,
      totalPlayTime: 0,
      gamesPlayed: 0,
      shieldBlocks: 0,
      levelTime: 0,
      sessionKills: 0,
      perfectLevels: 0
    };
    
    this.loadProgress();
  }
  
  loadProgress() {
    try {
      const saved = localStorage.getItem('tankGameAchievements');
      if (saved) {
        const data = JSON.parse(saved);
        Object.assign(this.achievements, data.achievements || {});
        Object.assign(this.stats, data.stats || {});
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
  }
  
  saveProgress() {
    try {
      localStorage.setItem('tankGameAchievements', JSON.stringify({
        achievements: this.achievements,
        stats: this.stats
      }));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }
  
  checkAchievements() {
    const unlocked = [];
    
    // 首次击杀
    if (this.stats.totalKills >= 1 && !this.achievements.firstBlood.unlocked) {
      this.achievements.firstBlood.unlocked = true;
      unlocked.push(this.achievements.firstBlood);
    }
    
    // 神枪手
    if (this.stats.sessionKills >= 10 && !this.achievements.sharpshooter.unlocked) {
      this.achievements.sharpshooter.unlocked = true;
      unlocked.push(this.achievements.sharpshooter);
    }
    
    // 不死之身
    if (this.stats.shieldBlocks >= 5 && !this.achievements.immortal.unlocked) {
      this.achievements.immortal.unlocked = true;
      unlocked.push(this.achievements.immortal);
    }
    
    // 破坏者
    if (this.stats.blocksDestroyed >= 100 && !this.achievements.destroyer.unlocked) {
      this.achievements.destroyer.unlocked = true;
      unlocked.push(this.achievements.destroyer);
    }
    
    // 老兵
    if (this.stats.totalKills >= 100 && !this.achievements.veteran.unlocked) {
      this.achievements.veteran.unlocked = true;
      unlocked.push(this.achievements.veteran);
    }
    
    // 坦克大师
    if (this.stats.highestLevel >= 5 && !this.achievements.master.unlocked) {
      this.achievements.master.unlocked = true;
      unlocked.push(this.achievements.master);
    }
    
    // 收藏家
    if (this.stats.powerUpsCollected >= 20 && !this.achievements.collector.unlocked) {
      this.achievements.collector.unlocked = true;
      unlocked.push(this.achievements.collector);
    }
    
    this.saveProgress();
    return unlocked;
  }
  
  recordKill() {
    this.stats.totalKills++;
    this.stats.sessionKills++;
    return this.checkAchievements();
  }
  
  recordDeath() {
    this.stats.totalDeaths++;
    this.saveProgress();
  }
  
  recordShot() {
    this.stats.totalShots++;
  }
  
  recordHit() {
    this.stats.totalHits++;
  }
  
  recordBlockDestroyed() {
    this.stats.blocksDestroyed++;
    return this.checkAchievements();
  }
  
  recordPowerUpCollected() {
    this.stats.powerUpsCollected++;
    return this.checkAchievements();
  }
  
  recordShieldBlock() {
    this.stats.shieldBlocks++;
    return this.checkAchievements();
  }
  
  recordLevelComplete(level, time, deaths) {
    if (level > this.stats.highestLevel) {
      this.stats.highestLevel = level;
    }
    
    this.stats.levelTime = time;
    
    if (deaths === 0) {
      this.stats.perfectLevels++;
      if (!this.achievements.survivor.unlocked) {
        this.achievements.survivor.unlocked = true;
        const unlocked = [this.achievements.survivor];
        this.saveProgress();
        return { unlocked, stats: this.achievements };
      }
    }
    
    if (time <= 60 && !this.achievements.speedrun.unlocked) {
      this.achievements.speedrun.unlocked = true;
      const unlocked = [this.achievements.speedrun];
      this.saveProgress();
      return { unlocked, stats: this.achievements };
    }
    
    return this.checkAchievements();
  }
  
  recordGameStart() {
    this.stats.gamesPlayed++;
    this.stats.sessionKills = 0;
    this.saveProgress();
  }
  
  recordScore(score) {
    if (score >= 10000 && !this.achievements.perfect.unlocked) {
      this.achievements.perfect.unlocked = true;
      this.saveProgress();
      return [this.achievements.perfect];
    }
    return [];
  }
  
  getStats() {
    return {
      ...this.stats,
      accuracy: this.stats.totalShots > 0 
        ? Math.round((this.stats.totalHits / this.stats.totalShots) * 100) 
        : 0,
      kdRatio: this.stats.totalDeaths > 0 
        ? (this.stats.totalKills / this.stats.totalDeaths).toFixed(2) 
        : this.stats.totalKills
    };
  }
  
  getAchievements() {
    return Object.entries(this.achievements).map(([key, achievement]) => ({
      id: key,
      ...achievement
    }));
  }
  
  getUnlockedCount() {
    return Object.values(this.achievements).filter(a => a.unlocked).length;
  }
  
  getTotalCount() {
    return Object.keys(this.achievements).length;
  }
  
  reset() {
    Object.keys(this.achievements).forEach(key => {
      this.achievements[key].unlocked = false;
    });
    
    Object.keys(this.stats).forEach(key => {
      this.stats[key] = 0;
    });
    
    this.saveProgress();
  }
}

/**
 * 成就通知UI
 */
export function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-content">
      <div class="achievement-title">成就解锁！</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-description">${achievement.description}</div>
    </div>
  `;
  
  // 添加样式（如果还没有）
  if (!document.getElementById('achievement-styles')) {
    const style = document.createElement('style');
    style.id = 'achievement-styles';
    style.textContent = `
      .achievement-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 16px;
        max-width: 350px;
        animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s;
        z-index: 10000;
      }
      
      .achievement-icon {
        font-size: 48px;
        animation: bounce 0.6s ease;
      }
      
      .achievement-content {
        flex: 1;
      }
      
      .achievement-title {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.9;
        margin-bottom: 4px;
      }
      
      .achievement-name {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      
      .achievement-description {
        font-size: 14px;
        opacity: 0.9;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateX(400px);
        }
      }
      
      @keyframes bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

