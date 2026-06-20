// learn.js - 学习模块
// 管理白名单/黑名单和学习到的关键词/特征
// 支持从 learn_data.js 加载默认数据，以及导出/导入功能

(function() {
  const STORAGE_KEY_LEARNED = 'mosaic_learned_keywords';
  const STORAGE_KEY_WHITELIST = 'mosaic_whitelist';
  const STORAGE_KEY_BLACKLIST = 'mosaic_blacklist';
  const STORAGE_KEY_PATTERNS = 'mosaic_learned_patterns';

  // ---- 从 learn_data.js 加载默认数据 ----
  function loadDefaultData() {
    if (typeof window.LEARNED_DATA !== 'undefined') {
      console.log('📚 从 learn_data.js 加载默认学习数据');
      return window.LEARNED_DATA;
    }
    return null;
  }

  // ---- 合并默认数据和用户数据 ----
  function mergeWithDefault(userData, defaultData, key) {
    if (!defaultData || !defaultData[key]) return userData;
    const defaultItems = defaultData[key] || [];
    // 合并去重
    const merged = [...new Set([...defaultItems, ...userData])];
    return merged;
  }

  function mergePatternsWithDefault(userPatterns, defaultPatterns) {
    if (!defaultPatterns || defaultPatterns.length === 0) return userPatterns;
    // 合并去重（按 type + pattern）
    const merged = [...userPatterns];
    for (const dp of defaultPatterns) {
      const exists = merged.some(p => p.type === dp.type && p.pattern === dp.pattern);
      if (!exists) merged.push(dp);
    }
    return merged;
  }

  // ---- 学习到的关键词 ----
  function loadLearnedKeywordsData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEARNED);
      const userData = saved ? JSON.parse(saved) : [];
      const defaultData = loadDefaultData();
      return mergeWithDefault(userData, defaultData, 'keywords');
    } catch {
      return [];
    }
  }

  function saveLearnedKeywordData(keyword) {
    const learned = loadLearnedKeywordsData();
    const kw = keyword.toLowerCase().trim().replace(/\s+/g, ' ');
    if (kw && !learned.includes(kw)) {
      learned.push(kw);
      // 只保存用户数据到 localStorage（不含默认数据）
      const saved = localStorage.getItem(STORAGE_KEY_LEARNED);
      const userData = saved ? JSON.parse(saved) : [];
      if (!userData.includes(kw)) {
        userData.push(kw);
        localStorage.setItem(STORAGE_KEY_LEARNED, JSON.stringify(userData));
      }
      console.log('📚 学习到新关键词:', kw);
    }
  }

  function clearLearnedKeywords() {
    localStorage.removeItem(STORAGE_KEY_LEARNED);
  }

  // ---- 白名单 ----
  function loadWhitelistData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WHITELIST);
      const userData = saved ? JSON.parse(saved) : [];
      const defaultData = loadDefaultData();
      return mergeWithDefault(userData, defaultData, 'whitelist');
    } catch {
      return [];
    }
  }

  function saveWhitelistData(text) {
    const list = loadWhitelistData();
    const t = text.toLowerCase().trim().replace(/\s+/g, ' ');
    if (t && !list.includes(t)) {
      list.push(t);
      // 只保存用户数据到 localStorage
      const saved = localStorage.getItem(STORAGE_KEY_WHITELIST);
      const userData = saved ? JSON.parse(saved) : [];
      if (!userData.includes(t)) {
        userData.push(t);
        localStorage.setItem(STORAGE_KEY_WHITELIST, JSON.stringify(userData));
        console.log('➕ 白名单新增:', t);
      }
    }
  }

  function removeFromWhitelist(text) {
    const list = loadWhitelistData();
    const t = text.toLowerCase().trim().replace(/\s+/g, ' ');
    const idx = list.indexOf(t);
    if (idx !== -1) {
      list.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_WHITELIST, JSON.stringify(list));
    }
  }

  function clearWhitelist() {
    localStorage.removeItem(STORAGE_KEY_WHITELIST);
  }

  // ---- 黑名单 ----
  function loadBlacklistData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BLACKLIST);
      const userData = saved ? JSON.parse(saved) : [];
      const defaultData = loadDefaultData();
      return mergeWithDefault(userData, defaultData, 'blacklist');
    } catch {
      return [];
    }
  }

  function saveBlacklistData(text) {
    const list = loadBlacklistData();
    const t = text.toLowerCase().trim().replace(/\s+/g, ' ');
    if (t && !list.includes(t)) {
      list.push(t);
      // 只保存用户数据到 localStorage
      const saved = localStorage.getItem(STORAGE_KEY_BLACKLIST);
      const userData = saved ? JSON.parse(saved) : [];
      if (!userData.includes(t)) {
        userData.push(t);
        localStorage.setItem(STORAGE_KEY_BLACKLIST, JSON.stringify(userData));
        console.log('🚫 黑名单新增:', t);
      }
    }
  }

  function removeFromBlacklist(text) {
    const list = loadBlacklistData();
    const t = text.toLowerCase().trim().replace(/\s+/g, ' ');
    const idx = list.indexOf(t);
    if (idx !== -1) {
      list.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_BLACKLIST, JSON.stringify(list));
    }
  }

  function clearBlacklist() {
    localStorage.removeItem(STORAGE_KEY_BLACKLIST);
  }

  // ---- 格式特征 ----
  function loadLearnedPatterns() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PATTERNS);
      const userPatterns = saved ? JSON.parse(saved) : [];
      const defaultData = loadDefaultData();
      return mergePatternsWithDefault(userPatterns, defaultData ? defaultData.patterns : null);
    } catch {
      return [];
    }
  }

  function extractPatterns(text) {
    const patterns = [];
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // 1. 提单号格式
    if (/^\d{3}-\d{8}$/.test(trimmed)) {
      patterns.push({ type: 'bill_of_lading', pattern: '\\d{3}-\\d{8}', desc: '提单号格式' });
    }

    // 2. 纯数字ID
    if (/^\d{9,12}$/.test(trimmed)) {
      patterns.push({ type: 'pure_number', pattern: '\\d{9,12}', desc: '纯数字ID' });
    }

    // 3. 字母+数字混合ID
    if (/^[A-Z]{2,3}\d{7,10}$/i.test(trimmed)) {
      patterns.push({ type: 'letter_number_id', pattern: '[A-Z]{2,3}\\d{7,10}', desc: '字母数字混合ID' });
    }

    // 4. 电话号码格式
    if (/\d{2,4}[-\s]\d{3,4}[-\s]\d{3,4}/.test(trimmed) && /\d{7,11}/.test(trimmed.replace(/[-\s]/g, ''))) {
      patterns.push({ type: 'phone', pattern: '\\d{2,4}[-\\s]?\\d{3,4}[-\\s]?\\d{3,4}', desc: '电话号码格式' });
    }

    // 5. 重量格式
    if (/^\d+\s*(kg|lb|kilo|pound|lbs|pcs|ctns)c?(s)?$/i.test(trimmed)) {
      patterns.push({ type: 'weight', pattern: '\\d+\\s*(kg|lb|kilo|pound|lbs|pcs|ctns)', desc: '重量/数量格式' });
    }

    // 6. 通用数字+单位格式
    const unitMatch = lower.match(/^(\d+)\s*([a-z]+)$/);
    if (unitMatch && unitMatch[2].length >= 2 && unitMatch[2].length <= 6) {
      patterns.push({ type: 'number_unit', pattern: '\\d+\\s*' + unitMatch[2], desc: `数字+${unitMatch[2]}格式` });
    }

    // 7. 纯地名
    const locations = ['latam', 'mia', 'lax', 'jfk', 'mex', 'cargo', 'shanghai', 'beijing', 'shenzhen', 'guangzhou'];
    if (locations.some(loc => lower === loc || lower.startsWith(loc + ' '))) {
      patterns.push({ type: 'location', pattern: lower, desc: '地名' });
    }

    // 8. 域名后缀
    const domainMatch = lower.match(/\.[a-z]{2,6}$/);
    if (domainMatch) {
      patterns.push({ type: 'domain_suffix', pattern: domainMatch[0], desc: '域名后缀' });
    }

    // 9. 货币+金额格式
    if (lower.includes('usd') && /\d+\.?\d*/.test(lower)) {
      patterns.push({ type: 'currency_usd', pattern: 'usd.*\\d+|\\d+.*usd', desc: 'USD金额格式' });
    }
    if (lower.includes('eur') && /\d+\.?\d*/.test(lower)) {
      patterns.push({ type: 'currency_eur', pattern: 'eur.*\\d+|\\d+.*eur', desc: 'EUR金额格式' });
    }

    // 10. 邮箱格式
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,6}/i.test(trimmed)) {
      patterns.push({ type: 'email', pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,6}', desc: '邮箱格式' });
    }

    // 11. 价格单位格式
    if (lower.includes('per') && /\d+/.test(lower)) {
      patterns.push({ type: 'price_per', pattern: 'per.*\\d+|\\d+.*per', desc: '价格/单位格式' });
    }
    if (lower.includes('kilo') && /\d+/.test(lower)) {
      patterns.push({ type: 'price_kilo', pattern: 'kilo.*\\d+|\\d+.*kilo', desc: '每公斤价格格式' });
    }

    return patterns;
  }

  function saveLearnedPattern(pattern) {
    const patterns = loadLearnedPatterns();
    const exists = patterns.some(p => p.type === pattern.type && p.pattern === pattern.pattern);
    if (!exists) {
      patterns.push(pattern);
      // 只保存用户数据到 localStorage
      const saved = localStorage.getItem(STORAGE_KEY_PATTERNS);
      const userPatterns = saved ? JSON.parse(saved) : [];
      const userExists = userPatterns.some(p => p.type === pattern.type && p.pattern === pattern.pattern);
      if (!userExists) {
        userPatterns.push(pattern);
        localStorage.setItem(STORAGE_KEY_PATTERNS, JSON.stringify(userPatterns));
        console.log('🧠 学习到新格式特征:', pattern.type, pattern.pattern);
      }
    }
  }

  function saveLearnedPatterns(newPatterns) {
    for (const p of newPatterns) {
      saveLearnedPattern(p);
    }
  }

  function clearLearnedPatterns() {
    localStorage.removeItem(STORAGE_KEY_PATTERNS);
  }

  function matchesLearnedPattern(text) {
    const patterns = loadLearnedPatterns();
    const lower = text.toLowerCase();
    for (const p of patterns) {
      try {
        const regex = new RegExp(p.pattern, 'i');
        if (regex.test(lower) || regex.test(text)) {
          return { matched: true, pattern: p };
        }
      } catch (e) {
        if (text.toLowerCase().includes(p.pattern.toLowerCase())) {
          return { matched: true, pattern: p };
        }
      }
    }
    return { matched: false };
  }

  // ---- 导出功能：生成 learn_data.js 文件内容 ----
  function exportLearnedData() {
    const data = {
      whitelist: loadWhitelistData(),
      blacklist: loadBlacklistData(),
      keywords: loadLearnedKeywordsData(),
      patterns: loadLearnedPatterns(),
      lastUpdate: new Date().toISOString()
    };

    const jsContent = `// learn_data.js - 学习数据存储文件
// 此文件由用户手动更新到 GitHub 仓库
// 格式：JSON 数据，包含白名单、黑名单、学习关键词、格式特征
// 最后更新：${data.lastUpdate}

const LEARNED_DATA = {
  // 白名单：这些内容不会被标记
  whitelist: ${JSON.stringify(data.whitelist, null, 2)},
  
  // 黑名单：这些内容强制标记
  blacklist: ${JSON.stringify(data.blacklist, null, 2)},
  
  // 学习到的关键词
  keywords: ${JSON.stringify(data.keywords, null, 2)},
  
  // 学习到的格式特征（用于排除）
  patterns: ${JSON.stringify(data.patterns, null, 2)},
  
  // 最后更新时间
  lastUpdate: '${data.lastUpdate}'
};

// 导出到全局
if (typeof window !== 'undefined') {
  window.LEARNED_DATA = LEARNED_DATA;
}`;

    return jsContent;
  }

  // ---- 导出为文件下载 ----
  function downloadLearnedData() {
    const content = exportLearnedData();
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'learn_data.js';
    link.click();
    URL.revokeObjectURL(url);
    console.log('📥 学习数据已导出为 learn_data.js');
  }

  // ---- 导入功能：从文件导入学习数据 ----
  function importLearnedData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (data.whitelist) {
        localStorage.setItem(STORAGE_KEY_WHITELIST, JSON.stringify(data.whitelist));
      }
      if (data.blacklist) {
        localStorage.setItem(STORAGE_KEY_BLACKLIST, JSON.stringify(data.blacklist));
      }
      if (data.keywords) {
        localStorage.setItem(STORAGE_KEY_LEARNED, JSON.stringify(data.keywords));
      }
      if (data.patterns) {
        localStorage.setItem(STORAGE_KEY_PATTERNS, JSON.stringify(data.patterns));
      }
      
      console.log('📤 学习数据已导入');
      return true;
    } catch (e) {
      console.error('导入失败:', e);
      return false;
    }
  }

  // ---- 清除所有学习数据 ----
  function clearAllLearnedData() {
    clearLearnedKeywords();
    clearWhitelist();
    clearBlacklist();
    clearLearnedPatterns();
    console.log('🗑️ 所有学习数据已清除');
  }

  // ---- 获取学习数据统计 ----
  function getLearnedDataStats() {
    return {
      whitelistCount: loadWhitelistData().length,
      blacklistCount: loadBlacklistData().length,
      keywordsCount: loadLearnedKeywordsData().length,
      patternsCount: loadLearnedPatterns().length,
      hasDefaultData: typeof window.LEARNED_DATA !== 'undefined'
    };
  }

  // 导出到全局
  window.loadLearnedKeywordsData = loadLearnedKeywordsData;
  window.saveLearnedKeywordData = saveLearnedKeywordData;
  window.clearLearnedKeywords = clearLearnedKeywords;
  window.loadWhitelistData = loadWhitelistData;
  window.saveWhitelistData = saveWhitelistData;
  window.removeFromWhitelist = removeFromWhitelist;
  window.clearWhitelist = clearWhitelist;
  window.loadBlacklistData = loadBlacklistData;
  window.saveBlacklistData = saveBlacklistData;
  window.removeFromBlacklist = removeFromBlacklist;
  window.clearBlacklist = clearBlacklist;
  window.loadLearnedPatterns = loadLearnedPatterns;
  window.saveLearnedPatterns = saveLearnedPatterns;
  window.saveLearnedPattern = saveLearnedPattern;
  window.clearLearnedPatterns = clearLearnedPatterns;
  window.matchesLearnedPattern = matchesLearnedPattern;
  window.extractPatterns = extractPatterns;
  window.exportLearnedData = exportLearnedData;
  window.downloadLearnedData = downloadLearnedData;
  window.importLearnedData = importLearnedData;
  window.clearAllLearnedData = clearAllLearnedData;
  window.getLearnedDataStats = getLearnedDataStats;

  console.log('📚 学习模块已加载');
})();