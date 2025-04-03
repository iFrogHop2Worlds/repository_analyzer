import { useState } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [repo, setRepo] = useState('');
  const [ignoreList, setIgnoreList] = useState([
    'package-lock.json',
    'node_modules',
    '.git',
    'build',
    'dist'
  ]);
  const [languages, setLanguages] = useState(null);
  const [error, setError] = useState(null);

  const commonIgnoreItems = [
      '.gitignore',
      '.git',
      'build',
      'dist',
      'coverage',
      '.env',
      '.DS_Store',
      '.idea',
      '.vscode',
      'package-lock.json',
      '/node_modules',
      'yarn.lock',
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'tslint.json',
      '.build.gradle',
      '.gradlew',
      '.gradlew.bat',
      '/gradle',
      '.gradle.properties',
      '.gradle.lockfile',
      '.gradle-wrapper.jar',
      '/build',
      '/target',
      '/assets',
      '/public',
      '/images',
      '.ico',
      'fonts',
      'styles',
      '.lock',
      '.lockfile',
      '.toml',
      '.xml',
      '.png',
      '.svg',
      '.css',
      '.scss',
      '.less',
      '.iml',
      '.md',
      '.example'
  ];

  const languageColors = {
    js: '#F7DF1E',
    python: '#3776AB',
    java: '#007396',
    csharp: '#239120',
    cpp: '#00599C',
    ruby: '#CC342D',
    php: '#777BB4',
    swift: '#FA7343',
    rs: '#DEA584',
    go: '#00ADD8',
    typescript: '#3178C6',
    kotlin: '#A97BFF',
    scala: '#DC322F',
    html: '#E34F26',
    css: '#1572B6',
    perl: '#39457E',
    haskell: '#5D4F85',
    r: '#276DC3',
    dart: '#0175C2',
    elixir: '#4B275F',
    clojure: '#5881D8',
    lua: '#000080',
    julia: '#9558B2',
    matlab: '#0076A8',
    shell: '#89E051'
  };

  function getLanguageColor(language) {
    const normalizedLang = language.toLowerCase();
    return languageColors[normalizedLang] || '#808080';
  }

  const handleIgnoreToggle = (item) => {
    setIgnoreList(prev =>
        prev.includes(item)
            ? prev.filter(i => i !== item)
            : [...prev, item]
    );
  };

  const getFileExtension = (path) => {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const shouldIncludeFile = (path, ignoreList) => {
    return !ignoreList.some(item => {
      if (item.startsWith('.')) {
        return path.endsWith(item);
      }

      if (item.startsWith('/')) {
        const folderName = item.slice(1);
        return path === folderName ||
            path.startsWith(folderName + '/') ||
            path.endsWith('/' + folderName);
      }

      return path === item ||
          path.startsWith(item + '/') ||
          path.endsWith('/' + item);
    });
  };

  const fetchLanguageStats = async (username, repo) => {
    const contentsResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/git/trees/main?recursive=1`);
    if (!contentsResponse.ok) {
      const masterResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/git/trees/master?recursive=1`);
      if (!masterResponse.ok) {
        throw new Error('Failed to fetch repository contents');
      }
      return await masterResponse.json();
    }
    const contentsData = await contentsResponse.json();

    return {
      contents: contentsData
    };
  };

  const calculateLanguageStats = (contents, ignoreList) => {
    const languageStats = new Map();

    contents.tree.forEach(item => {
      if (item.type === 'blob' && shouldIncludeFile(item.path, ignoreList)) {
        const ext = getFileExtension(item.path);
        if (ext) {
          const currentSize = languageStats.get(ext) || 0;
          languageStats.set(ext, currentSize + item.size);
        }
      }
    });

    const totalBytes = Array.from(languageStats.values()).reduce((a, b) => a + b, 0);

    return Array.from(languageStats.entries()).map(([ext, bytes]) => ({
      language: ext,
      bytes,
      percentage: ((bytes / totalBytes) * 100).toFixed(2)
    }));
  };

  const fetchLanguages = async () => {
    if (!username || !repo) {
      setError('Please enter both username and repository name');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const data = await fetchLanguageStats(username, repo);
      const languageStats = calculateLanguageStats(data.contents, ignoreList);

      setLanguages(languageStats);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
      <div className="App">
        <div className="container">
          <h1>Repository Statistics</h1>

          <div className="input-section">
            <input
                type="text"
                placeholder="GitHub Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="text"
                placeholder="Repository Name"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
            />
            <button onClick={fetchLanguages}>Get Stats</button>
          </div>

          <div className="ignore-section">
            <h3>Select files/folders to ignore:</h3>
            <div className="ignore-items">
              {commonIgnoreItems.map(item => (
                  <label key={item + Math.random()}>
                    <input
                        type="checkbox"
                        checked={ignoreList.includes(item)}
                        onChange={() => handleIgnoreToggle(item)}
                    />
                    {item}
                  </label>
              ))}
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          {languages && (
              <div className="results">
                <h3>Statistics:</h3>
                <div className="language-stats">
                  {languages.map(({ language, bytes, percentage }) => (
                      <div key={language} className="language-stat-item">
                        <div className="language-name">{language}</div>
                        <div className="language-bar">
                          <div
                              className="language-fill"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getLanguageColor(language)
                              }}
                          />
                        </div>
                        <div className="language-details">
                          {percentage}% ({(bytes / 1024).toFixed(2)} KB)
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

export default App;