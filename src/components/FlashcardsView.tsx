import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, RefreshCw, Check, X, FileText, Upload, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import type { Flashcard, FlashcardSet } from '../types';
import { audioSynthesizer } from './AudioSynthesizer';

interface FlashcardsViewProps {
  flashcardSets: FlashcardSet[];
  onAddSet: (set: FlashcardSet) => void;
  onDeleteSet: (setId: string) => void;
  onUpdateSetCards: (setId: string, cards: Flashcard[]) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcardSets,
  onAddSet,
  onDeleteSet,
  onUpdateSetCards
}) => {
  // Navigation State
  const [activeView, setActiveView] = useState<'sets' | 'study' | 'create' | 'import'>('sets');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // Study Mode States
  const [studyCardIndex, setStudyCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [studyRightCount, setStudyRightCount] = useState<number>(0);
  const [studyWrongCount, setStudyWrongCount] = useState<number>(0);
  const [studyFinished, setStudyFinished] = useState<boolean>(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);

  // Manual Set Creation States
  const [setName, setSetName] = useState<string>('');
  const [setDesc, setSetDesc] = useState<string>('');
  const [setCat, setSetCat] = useState<string>('General 📚');
  const [manualCards, setManualCards] = useState<{ front: string; back: string }[]>([
    { front: '', back: '' }
  ]);

  // Import Uploader States
  const [importedText, setImportedText] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [extractedPreviewCards, setExtractedPreviewCards] = useState<{ front: string; back: string }[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  // Active Selected Set Object Helper
  const activeSet = flashcardSets.find(s => s.id === selectedSetId);

  // Handlers for manual creation card grid
  const handleAddManualCardRow = () => {
    audioSynthesizer.playChime('click');
    setManualCards([...manualCards, { front: '', back: '' }]);
  };

  const handleRemoveManualCardRow = (index: number) => {
    audioSynthesizer.playChime('click');
    setManualCards(manualCards.filter((_, i) => i !== index));
  };

  const handleManualCardChange = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...manualCards];
    updated[index][field] = value;
    setManualCards(updated);
  };

  const handleSaveManualSet = () => {
    audioSynthesizer.playChime('complete');
    if (!setName.trim()) {
      alert('Please enter a name for your flashcard set.');
      return;
    }

    const validCards = manualCards
      .filter(c => c.front.trim() && c.back.trim())
      .map((c, idx) => ({
        id: `card_${Date.now()}_${idx}`,
        front: c.front.trim(),
        back: c.back.trim(),
        status: 'new' as const
      }));

    if (validCards.length === 0) {
      alert('Please add at least one complete flashcard (front and back).');
      return;
    }

    const newSet: FlashcardSet = {
      id: `set_${Date.now()}`,
      title: setName.trim(),
      description: setDesc.trim(),
      category: setCat.trim(),
      cards: validCards,
      createdAt: Date.now()
    };

    onAddSet(newSet);
    
    // Reset state and exit
    setSetName('');
    setSetDesc('');
    setManualCards([{ front: '', back: '' }]);
    setActiveView('sets');
  };

  // --- Document parsing engine ---
  const handleParseDocumentText = (text: string) => {
    const lines = text.split('\n');
    const parsed: { front: string; back: string }[] = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return; // Skip empty lines

      // 1. Q: [Question] A: [Answer] Pattern
      if (/q:/i.test(cleanLine) && /a:/i.test(cleanLine)) {
        const parts = cleanLine.split(/a:/i);
        const front = parts[0].replace(/q:/i, '').trim();
        const back = parts[1].trim();
        if (front && back) {
          parsed.push({ front, back });
          return;
        }
      }

      // 2. Dash/Separator matching (e.g. "Photosynthesis - Turn light into sugar", "Term = Definition")
      const separators = [' - ', ' = ', ' : ', '\t'];
      for (const sep of separators) {
        if (cleanLine.includes(sep)) {
          const parts = cleanLine.split(sep);
          const front = parts[0].trim();
          const back = parts.slice(1).join(sep).trim(); // re-join remaining parts in case they include the separator
          if (front && back) {
            parsed.push({ front, back });
            return;
          }
        }
      }

      // 3. Phrase-based matching: "[Term] is [definition]" or "[Term] means [definition]"
      const isMatch = cleanLine.match(/^(.+?)\s+(is|means)\s+(.+)$/i);
      if (isMatch && isMatch[1] && isMatch[3]) {
        // Clean off articles
        const front = isMatch[1].trim();
        const back = isMatch[3].trim();
        if (front.length < 50 && back.length > 5) { // reasonable assumptions for term-defn lengths
          parsed.push({ front, back });
          return;
        }
      }

      // 4. Default fallback: line has a question mark
      if (cleanLine.includes('?')) {
        const parts = cleanLine.split('?');
        const front = parts[0].trim() + '?';
        const back = parts.slice(1).join('?').trim();
        if (front && back) {
          parsed.push({ front, back });
          return;
        }
      }

      // 5. Ultimate fallback: put full line on front, leave back empty for user correction
      if (cleanLine.length > 4) {
        parsed.push({ front: cleanLine, back: '...' });
      }
    });

    setExtractedPreviewCards(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    audioSynthesizer.playChime('complete');

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (Array.isArray(data)) {
            // Assume format: [{front: "", back: ""}] or [{question: "", answer: ""}]
            const formatted = data.map(item => ({
              front: (item.front || item.question || item.term || '').toString().trim(),
              back: (item.back || item.answer || item.definition || '').toString().trim()
            })).filter(c => c.front);
            setExtractedPreviewCards(formatted);
          } else if (typeof data === 'object') {
            // Assume format: {"term": "definition", ...}
            const formatted = Object.entries(data).map(([key, val]) => ({
              front: key.trim(),
              back: (val as string).toString().trim()
            }));
            setExtractedPreviewCards(formatted);
          } else {
            setImportError('Invalid JSON structure.');
          }
        } catch (err) {
          setImportError('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    } 
    else if (file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const rows = content.split('\n');
          const parsed: { front: string; back: string }[] = [];
          
          rows.forEach(row => {
            if (!row.trim()) return;
            // Simple split. High-quality CSVs can contain quotes, but for flashcards a comma split is standard
            const cols = row.split(',');
            const front = cols[0]?.trim() || '';
            const back = cols.slice(1).join(',').trim() || '';
            if (front) {
              parsed.push({ front, back });
            }
          });
          setExtractedPreviewCards(parsed);
        } catch (err) {
          setImportError('Failed to read CSV file.');
        }
      };
      reader.readAsText(file);
    } 
    else {
      // Standard Text File
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportedText(text);
        handleParseDocumentText(text);
      };
      reader.readAsText(file);
    }
  };

  const handlePreviewCardChange = (idx: number, field: 'front' | 'back', val: string) => {
    const updated = [...extractedPreviewCards];
    updated[idx][field] = val;
    setExtractedPreviewCards(updated);
  };

  const handleRemovePreviewCard = (idx: number) => {
    audioSynthesizer.playChime('click');
    setExtractedPreviewCards(extractedPreviewCards.filter((_, i) => i !== idx));
  };

  const handleSaveImportedSet = () => {
    audioSynthesizer.playChime('complete');
    if (!setName.trim()) {
      alert('Please enter a name for this flashcard set.');
      return;
    }

    const validCards = extractedPreviewCards
      .filter(c => c.front.trim() && c.back.trim())
      .map((c, idx) => ({
        id: `card_${Date.now()}_${idx}`,
        front: c.front.trim(),
        back: c.back.trim(),
        status: 'new' as const
      }));

    if (validCards.length === 0) {
      alert('No valid parsed flashcards were found.');
      return;
    }

    const newSet: FlashcardSet = {
      id: `set_${Date.now()}`,
      title: setName.trim(),
      description: setDesc.trim() || `Extracted from ${importFileName || 'copied text'}`,
      category: setCat.trim(),
      cards: validCards,
      createdAt: Date.now()
    };

    onAddSet(newSet);

    // Reset
    setSetName('');
    setSetDesc('');
    setImportedText('');
    setImportFileName(null);
    setExtractedPreviewCards([]);
    setActiveView('sets');
  };

  // --- Study Session Controls ---
  const handleStartStudy = (setId: string) => {
    audioSynthesizer.playChime('complete');
    const set = flashcardSets.find(s => s.id === setId);
    if (!set || set.cards.length === 0) {
      alert('This flashcard set is empty!');
      return;
    }

    // Clone and shuffle cards for the study session!
    const shuffled = [...set.cards].sort(() => Math.random() - 0.5);

    setSelectedSetId(setId);
    setStudyQueue(shuffled);
    setStudyCardIndex(0);
    setIsCardFlipped(false);
    setStudyRightCount(0);
    setStudyWrongCount(0);
    setStudyFinished(false);
    setActiveView('study');
  };

  const handleStudyAction = (mastered: boolean) => {
    if (mastered) {
      audioSynthesizer.playChime('click');
      setStudyRightCount(prev => prev + 1);
      
      // Update card status in parent state
      if (activeSet) {
        const currentCard = studyQueue[studyCardIndex];
        const updatedCards = activeSet.cards.map(c => 
          c.id === currentCard.id ? { ...c, status: 'mastered' as const, lastStudied: Date.now() } : c
        );
        onUpdateSetCards(activeSet.id, updatedCards);
      }
    } else {
      audioSynthesizer.playChime('click');
      setStudyWrongCount(prev => prev + 1);
      
      // Update status to learning
      if (activeSet) {
        const currentCard = studyQueue[studyCardIndex];
        const updatedCards = activeSet.cards.map(c => 
          c.id === currentCard.id ? { ...c, status: 'learning' as const, lastStudied: Date.now() } : c
        );
        onUpdateSetCards(activeSet.id, updatedCards);
      }
    }

    // Go to next card or finish
    setTimeout(() => {
      setIsCardFlipped(false);
      
      setTimeout(() => {
        if (studyCardIndex + 1 >= studyQueue.length) {
          audioSynthesizer.playChime('complete');
          setStudyFinished(true);
        } else {
          setStudyCardIndex(prev => prev + 1);
        }
      }, 200); // Wait for card to unflipped
    }, 100);
  };

  const handleRestartStudy = () => {
    if (!selectedSetId) return;
    handleStartStudy(selectedSetId);
  };

  // --- RENDER MODES ---

  // 1. DASHBOARD MODE (LIST OF ALL SETS)
  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="cute-title">Flashcard Hub 🌸</h1>
          <p className="cute-subtitle">Level up your definitions & trivia</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { audioSynthesizer.playChime('click'); setActiveView('create'); }}
            className="btn-circle"
            title="Create manual set"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => { audioSynthesizer.playChime('click'); setActiveView('import'); }}
            className="btn-circle"
            style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)' }}
            title="Upload document/extract"
          >
            <Upload size={18} style={{ color: 'var(--accent)' }} />
          </button>
        </div>
      </div>

      {flashcardSets.length === 0 ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', gap: '10px', textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Flashcard Sets Yet</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '80%' }}>
            Upload notes, import CSV/text definition lists, or create custom card sets to start studying SSC formulas!
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="btn-cute" onClick={() => setActiveView('import')}>
              <Sparkles size={14} /> Smart Extract Document
            </button>
            <button className="btn-cute btn-cute-secondary" onClick={() => setActiveView('create')}>
              Create Manually
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {flashcardSets.map(set => {
            const masteredCount = set.cards.filter(c => c.status === 'mastered').length;
            const progressPct = set.cards.length > 0 ? (masteredCount / set.cards.length) * 100 : 0;
            
            return (
              <div
                key={set.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => handleStartStudy(set.id)}
              >
                {/* Delete Set */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    audioSynthesizer.playChime('click');
                    if (confirm(`Delete the set "${set.title}"?`)) onDeleteSet(set.id);
                  }}
                  className="btn-circle"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '28px',
                    height: '28px',
                    borderColor: 'transparent',
                    background: 'transparent',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Trash2 size={13} className="delete-icon-hover" />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-medium" style={{ fontSize: '9px', padding: '2px 8px' }}>
                    {set.category || 'General'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {set.cards.length} cards
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', width: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {set.title}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineBreak: 'anywhere' }}>
                  {set.description || 'No description provided.'}
                </p>

                {/* Progress bar */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{masteredCount} / {set.cards.length} Mastered</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: 'var(--accent)', borderRadius: '4px', transition: 'var(--transition-smooth)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 2. STUDY MODE
  const renderStudyMode = () => {
    if (!activeSet || studyQueue.length === 0) return null;
    const currentCard = studyQueue[studyCardIndex];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Studying: {activeSet.title}</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Shuffle Mode</span>
          </div>
        </div>

        {studyFinished ? (
          /* Finished Screen */
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 16px', textAlign: 'center', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
              Set Finished!
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '80%' }}>
              Incredible focus, Bujjithalli! Let's check how you performed:
            </p>

            <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>{studyRightCount}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>MASTERED ✅</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#e11d48' }}>{studyWrongCount}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>NEED STUDY ❌</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '10px' }}>
              <button className="btn-cute" onClick={handleRestartStudy}>
                <RefreshCw size={14} /> Study Again
              </button>
              <button className="btn-cute btn-cute-secondary" onClick={() => setActiveView('sets')}>
                Back to Flashcards list
              </button>
            </div>
          </div>
        ) : (
          /* Active Card Study */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {/* Progress indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Card {studyCardIndex + 1} of {studyQueue.length}</span>
                <span>{Math.round(((studyCardIndex) / studyQueue.length) * 100)}% Complete</span>
              </div>
              <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((studyCardIndex) / studyQueue.length) * 100}%`, backgroundColor: 'var(--accent)', transition: 'var(--transition-smooth)' }} />
              </div>
            </div>

            {/* 3D Flip Card Container */}
            <div
              className={`flashcard-3d-container ${isCardFlipped ? 'flipped' : ''}`}
              onClick={() => { audioSynthesizer.playChime('click'); setIsCardFlipped(!isCardFlipped); }}
            >
              <div className="flashcard-3d-card">
                {/* Front Side */}
                <div className="flashcard-front glass-panel">
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Term / Question
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', overflowY: 'auto', maxHeight: '80%', padding: '0 8px', lineBreak: 'anywhere' }}>
                    {currentCard.front}
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', fontSize: '9px', color: 'var(--text-secondary)', opacity: 0.6, fontWeight: 700 }}>
                    💡 Tap card to flip & check answer
                  </div>
                </div>

                {/* Back Side */}
                <div className="flashcard-back glass-panel">
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', opacity: 0.7, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Definition / Answer
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', overflowY: 'auto', maxHeight: '80%', padding: '0 8px', lineBreak: 'anywhere' }}>
                    {currentCard.back}
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', fontSize: '9px', color: 'var(--accent)', opacity: 0.7, fontWeight: 700 }}>
                    ✨ Cozy Focus learning
                  </div>
                </div>
              </div>
            </div>

            {/* Study controls */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                onClick={() => handleStudyAction(false)}
                className="btn-cute btn-cute-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: '16px', backgroundColor: '#ffe4e6', color: '#e11d48', borderColor: 'rgba(225,29,72,0.1)' }}
              >
                <X size={16} /> Need Practice
              </button>
              <button
                onClick={() => handleStudyAction(true)}
                className="btn-cute"
                style={{ flex: 1, padding: '12px', borderRadius: '16px', backgroundColor: '#dcfce7', color: '#16a34a' }}
              >
                <Check size={16} /> Got It!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. CREATE MANUAL SET MODE
  const renderCreateSet = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
          <ArrowLeft size={14} />
        </button>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>New Flashcard Set</h3>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Set Title
          </label>
          <input
            type="text"
            placeholder="e.g. Quant Algebra Formulas 📐"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            className="input-cute"
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Description
          </label>
          <input
            type="text"
            placeholder="Brief summaries or formula details"
            value={setDesc}
            onChange={(e) => setSetDesc(e.target.value)}
            className="input-cute"
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Category
          </label>
          <select
            value={setCat}
            onChange={(e) => setSetCat(e.target.value)}
            className="input-cute"
            style={{ appearance: 'none', background: 'var(--glass-bg)' }}
          >
            <option value="General 📚">General 📚</option>
            <option value="Quant 📐">Quant 📐</option>
            <option value="English 🔤">English 🔤</option>
            <option value="History 🏛️">History 🏛️</option>
            <option value="GK / Polity 🌸">GK / Polity 🌸</option>
          </select>
        </div>
      </div>

      {/* Manual Cards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Cards</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '2px' }}>
          {manualCards.map((card, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              {manualCards.length > 1 && (
                <button
                  onClick={() => handleRemoveManualCardRow(idx)}
                  className="btn-circle"
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderColor: 'transparent', background: 'transparent', color: 'var(--text-secondary)' }}
                >
                  <Trash2 size={12} className="delete-icon-hover" />
                </button>
              )}

              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)' }}>Card #{idx + 1}</span>

              <div>
                <input
                  type="text"
                  placeholder="Term / Question"
                  value={card.front}
                  onChange={(e) => handleManualCardChange(idx, 'front', e.target.value)}
                  className="input-cute"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Definition / Answer"
                  value={card.back}
                  onChange={(e) => handleManualCardChange(idx, 'back', e.target.value)}
                  className="input-cute"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="btn-cute btn-cute-secondary" onClick={handleAddManualCardRow} style={{ padding: '8px' }}>
          <Plus size={14} /> Add Card Row
        </button>

        <button className="btn-cute" onClick={handleSaveManualSet} style={{ marginTop: '4px' }}>
          Save Flashcard Set 🌸
        </button>
      </div>
    </div>
  );

  // 4. DOCUMENT IMPORT & AUTO-EXTRACTION MODE
  const renderImportSet = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
          <ArrowLeft size={14} />
        </button>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Document Question Extractor</h3>
      </div>

      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} style={{ color: 'var(--accent)' }} /> Extract cards automatically from text definitions or files!
        </span>

        {/* File Dropzone */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 10px',
            border: '2px dashed var(--glass-border)',
            borderRadius: '16px',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            transition: 'var(--transition-smooth)'
          }}
        >
          <FileText size={24} style={{ color: 'var(--text-secondary)', marginBottom: '6px' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {importFileName ? `Selected: ${importFileName}` : 'Upload File (.txt, .csv, .json)'}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Accepts text lists, comma-separated sheets, or JSON objects. Max 2MB.
          </span>
          <input
            type="file"
            accept=".txt,.csv,.json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>

        {importError && (
          <div style={{ color: '#e11d48', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> {importError}
          </div>
        )}

        {/* Or Paste Raw Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Or Paste Text Definitions below:</label>
          <textarea
            placeholder={`Paste lists of definitions, e.g.:
Mitochondria - The powerhouse of the cell
Photosynthesis - Process that plants use to make food
Q: What is a noun? A: A person, place, or thing.`}
            value={importedText}
            onChange={(e) => {
              setImportedText(e.target.value);
              handleParseDocumentText(e.target.value);
            }}
            className="input-cute"
            rows={4}
            style={{ resize: 'vertical', fontSize: '11px', fontFamily: 'var(--font-main)' }}
          />
        </div>
      </div>

      {extractedPreviewCards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Metadata for Set */}
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} /> Extracted Flashcards ({extractedPreviewCards.length})
          </h4>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
            <div>
              <input
                type="text"
                placeholder="Set Name (e.g. Science terms)"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                className="input-cute"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <input
                type="text"
                placeholder="Description (Optional)"
                value={setDesc}
                onChange={(e) => setSetDesc(e.target.value)}
                className="input-cute"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
              <select
                value={setCat}
                onChange={(e) => setSetCat(e.target.value)}
                className="input-cute"
                style={{ padding: '6px 10px', fontSize: '12px', appearance: 'none', background: 'var(--glass-bg)' }}
              >
                <option value="General 📚">General 📚</option>
                <option value="Quant 📐">Quant 📐</option>
                <option value="English 🔤">English 🔤</option>
                <option value="GK / Polity 🌸">GK / Polity 🌸</option>
              </select>
            </div>
          </div>

          {/* Cards Preview List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
            {extractedPreviewCards.map((card, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                <button
                  onClick={() => handleRemovePreviewCard(idx)}
                  className="btn-circle"
                  style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderColor: 'transparent', background: 'transparent', color: 'var(--text-secondary)' }}
                >
                  <Trash2 size={11} className="delete-icon-hover" />
                </button>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)' }}>Preview Card #{idx + 1}</span>
                
                <input
                  type="text"
                  value={card.front}
                  onChange={(e) => handlePreviewCardChange(idx, 'front', e.target.value)}
                  className="input-cute"
                  style={{ padding: '4px 8px', fontSize: '11px', borderStyle: 'dashed' }}
                />
                <input
                  type="text"
                  value={card.back}
                  onChange={(e) => handlePreviewCardChange(idx, 'back', e.target.value)}
                  className="input-cute"
                  style={{ padding: '4px 8px', fontSize: '11px', borderStyle: 'dashed' }}
                />
              </div>
            ))}
          </div>

          <button className="btn-cute" onClick={handleSaveImportedSet}>
            Import & Create Flashcard Set 🌸
          </button>
        </div>
      )}
    </div>
  );

  // SWITCH RENDERS
  switch (activeView) {
    case 'sets':
      return renderDashboard();
    case 'study':
      return renderStudyMode();
    case 'create':
      return renderCreateSet();
    case 'import':
      return renderImportSet();
    default:
      return renderDashboard();
  }
};
export default FlashcardsView;
