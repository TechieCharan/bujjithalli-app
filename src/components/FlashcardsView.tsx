import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, RefreshCw, Check, X, FileText, Upload, Sparkles, BookOpen, AlertCircle, Timer, TrendingUp, Activity, Award } from 'lucide-react';
import type { Flashcard, FlashcardSet, QuizAttempt, QuizQuestion } from '../types';
import { audioSynthesizer } from './AudioSynthesizer';

interface FlashcardsViewProps {
  flashcardSets: FlashcardSet[];
  quizAttempts: QuizAttempt[];
  onAddSet: (set: FlashcardSet) => void;
  onDeleteSet: (setId: string) => void;
  onUpdateSetCards: (setId: string, cards: Flashcard[]) => void;
  onLogAttempt: (attempt: QuizAttempt) => void;
}

// 10 General Study Challenge questions to backfill short PDF uploads
const STUDY_CHALLENGE_TEMPLATES = [
  { front: "Who is known as the Father of the Indian Constitution?", back: "Dr. B. R. Ambedkar" },
  { front: "Which article of the Indian Constitution guarantees the Right to Equality?", back: "Article 14" },
  { front: "What is the powerhouse of the cell?", back: "Mitochondria" },
  { front: "What is the value of acceleration due to gravity on Earth's surface?", back: "9.8 m/s^2" },
  { front: "Who wrote the famous book 'Discovery of India'?", back: "Jawaharlal Nehru" },
  { front: "Which planet is known as the Red Planet?", back: "Mars" },
  { front: "What is the chemical formula for common salt?", back: "NaCl" },
  { front: "In which year did India get Independence from British rule?", back: "1947" },
  { front: "Which element has the atomic number 1?", back: "Hydrogen" },
  { front: "What is the capital city of Japan?", back: "Tokyo" }
];

// Dynamically load PDF.js from CDN
const loadPDFJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

// Client-side PDF text extractor utilizing PDF.js
const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const pdfjsLib = await loadPDFJS();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  
  // Extract up to 10 pages for speed/safety
  const numPages = Math.min(pdf.numPages, 10);
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcardSets,
  quizAttempts,
  onAddSet,
  onDeleteSet,
  onUpdateSetCards,
  onLogAttempt
}) => {
  // Navigation State
  const [activeView, setActiveView] = useState<'sets' | 'study' | 'create' | 'import' | 'quiz' | 'efficiency'>('sets');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // Study Mode States (Flip card)
  const [studyCardIndex, setStudyCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [studyRightCount, setStudyRightCount] = useState<number>(0);
  const [studyWrongCount, setStudyWrongCount] = useState<number>(0);
  const [studyFinished, setStudyFinished] = useState<boolean>(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);

  // Quiz Mode States (Timer driven)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizTimer, setQuizTimer] = useState<number>(15);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(15);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizIsLocked, setQuizIsLocked] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<{ isCorrect: boolean; timeSpent: number }[]>([]);
  const [quizTimeSpentTotal, setQuizTimeSpentTotal] = useState<number>(0);
  const [quizFinishedState, setQuizFinishedState] = useState<boolean>(false);
  const [showConfigTimer, setShowConfigTimer] = useState<boolean>(false);
  const [timerSetupSeconds, setTimerSetupSeconds] = useState<number>(15);
  const [isChallengeMode, setIsChallengeMode] = useState<boolean>(false);

  // Multi-Strategy Quiz Parameters & States
  const [quizStrategy, setQuizStrategy] = useState<'mcq' | 'tf' | 'type_in' | 'matching'>('mcq');
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [showTypeInHint, setShowTypeInHint] = useState<boolean>(false);
  const [typeInFeedback, setTypeInFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [tfStatementCorrect, setTfStatementCorrect] = useState<boolean>(true);
  const [tfDisplayBack, setTfDisplayBack] = useState<string>('');
  const [matchingTiles, setMatchingTiles] = useState<{ id: string; text: string; type: 'front' | 'back'; originalCardId: string; matched: boolean; wrong: boolean }[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [matchingRoundCorrectCount, setMatchingRoundCorrectCount] = useState<number>(0);

  // Document Strategy Selector State
  const [extractionStrategy, setExtractionStrategy] = useState<'pairs' | 'summarize' | 'cloze' | 'qa'>('pairs');

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
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);

  // Active Selected Set Object Helper
  const activeSet = flashcardSets.find(s => s.id === selectedSetId);

  // --- Quiz countdown timer effect ---
  React.useEffect(() => {
    if (activeView !== 'quiz' || quizIsLocked || quizFinishedState) return;

    const timerInterval = setInterval(() => {
      setQuizTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleQuizTimeExpired();
          return 0;
        }
        return prev - 1;
      });
      setQuizTimeSpentTotal(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeView, quizIndex, quizIsLocked, quizFinishedState]);

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
  const handleParseDocumentText = (text: string, strategy: 'pairs' | 'summarize' | 'cloze' | 'qa' = 'pairs') => {
    if (!text.trim()) {
      setExtractedPreviewCards([]);
      return;
    }

    const parsed: { front: string; back: string }[] = [];

    // Stop words for Cloze deletions
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'in', 'of', 'to', 'by', 'from',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
      'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'whose',
      'what', 'why', 'how', 'when', 'where', 'with', 'about', 'against', 'between', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      's', 't', 'can', 'will', 'just', 'should', 'now', 'which', 'who', 'whom', 'whose'
    ]);

    if (strategy === 'pairs') {
      const lines = text.split('\n');
      lines.forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

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

        // 2. Dash/Separator matching
        const separators = [' - ', ' = ', ' : ', '\t'];
        for (const sep of separators) {
          if (cleanLine.includes(sep)) {
            const parts = cleanLine.split(sep);
            const front = parts[0].trim();
            const back = parts.slice(1).join(sep).trim();
            if (front && back) {
              parsed.push({ front, back });
              return;
            }
          }
        }

        // 3. Phrase-based matching
        const isMatch = cleanLine.match(/^(.+?)\s+(is|means)\s+(.+)$/i);
        if (isMatch && isMatch[1] && isMatch[3]) {
          const front = isMatch[1].trim();
          const back = isMatch[3].trim();
          if (front.length < 50 && back.length > 5) {
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

        // 5. Ultimate fallback
        if (cleanLine.length > 4) {
          parsed.push({ front: cleanLine, back: '...' });
        }
      });
    } 
    else if (strategy === 'summarize') {
      const paragraphs = text.split(/\n+/);
      paragraphs.forEach((para) => {
        if (!para.trim()) return;
        const sentences = para.split(/(?<=[.!?])\s+/);
        sentences.forEach((sentence) => {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length < 15) return;

          // Match definitions: is, are, was, were, refers to, means, stands for, called
          const copulaRegex = /\s+(is defined as|refers to|stands for|means|is called|is|are|was|were)\s+/i;
          const match = cleanSentence.match(copulaRegex);
          if (match && match.index) {
            const copula = match[0];
            const copulaIndex = cleanSentence.indexOf(copula);
            const front = cleanSentence.substring(0, copulaIndex).trim();
            let back = cleanSentence.substring(copulaIndex + copula.length).trim();

            if (back) {
              back = back.charAt(0).toUpperCase() + back.slice(1);
              if (front.length > 2 && front.length < 60 && back.length > 4) {
                parsed.push({ front, back: `${copula.trim()} ${back}` });
              }
            }
          }
        });
      });
    } 
    else if (strategy === 'cloze') {
      const sentences = text.split(/(?<=[.!?])\s+/);
      sentences.forEach((sentence) => {
        const clean = sentence.trim().replace(/\s+/g, ' ');
        if (clean.length < 20) return;

        const words = clean.split(/[^a-zA-Z]+/);
        let bestWord = '';
        let bestScore = 0;

        words.forEach((w) => {
          const lowerW = w.toLowerCase();
          if (lowerW.length < 4 || stopWords.has(lowerW)) return;

          let score = lowerW.length;
          const isCapitalized = w.charAt(0) === w.charAt(0).toUpperCase() && w.charAt(0) !== w.charAt(0).toLowerCase();
          if (isCapitalized) {
            score += 15;
          }

          if (score > bestScore) {
            bestScore = score;
            bestWord = w;
          }
        });

        if (bestWord) {
          const escapedWord = bestWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
          const front = clean.replace(regex, '______');
          if (front !== clean) {
            parsed.push({
              front,
              back: bestWord.charAt(0).toUpperCase() + bestWord.slice(1).toLowerCase()
            });
          }
        }
      });
    } 
    else if (strategy === 'qa') {
      const sentences = text.split(/(?<=[.!?])\s+/);
      for (let i = 0; i < sentences.length; i++) {
        const current = sentences[i].trim();
        if (current.endsWith('?') || /^(what|why|how|who|which|explain|define)\b/i.test(current)) {
          const front = current;
          let back = '';
          if (i + 1 < sentences.length) {
            back = sentences[i + 1].trim();
            if (back.length < 30 && i + 2 < sentences.length) {
              back += ' ' + sentences[i + 2].trim();
            }
          }
          if (front && back && back.length > 5) {
            parsed.push({ front, back });
          }
        }
      }
    }

    setExtractedPreviewCards(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    // Detect and Parse PDF on client-side
    if (file.name.endsWith('.pdf')) {
      setIsParsingPdf(true);
      audioSynthesizer.playChime('click');
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const text = await extractTextFromPDF(buffer);
          setImportedText(text);
          handleParseDocumentText(text, extractionStrategy);
          audioSynthesizer.playChime('complete');
        } catch (err) {
          console.error('PDF parsing error:', err);
          setImportError('Failed to parse PDF document. The file might be compressed or secure.');
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } 
    else if (file.name.endsWith('.json')) {
      audioSynthesizer.playChime('complete');
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (Array.isArray(data)) {
            const formatted = data.map(item => ({
              front: (item.front || item.question || item.term || '').toString().trim(),
              back: (item.back || item.answer || item.definition || '').toString().trim()
            })).filter(c => c.front);
            setExtractedPreviewCards(formatted);
          } else if (typeof data === 'object') {
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
      audioSynthesizer.playChime('complete');
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const rows = content.split('\n');
          const parsed: { front: string; back: string }[] = [];
          
          rows.forEach(row => {
            if (!row.trim()) return;
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
      audioSynthesizer.playChime('complete');
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportedText(text);
        handleParseDocumentText(text, extractionStrategy);
      };
      reader.readAsText(file);
    }
  };

  const handleStrategyChange = (strat: 'pairs' | 'summarize' | 'cloze' | 'qa') => {
    audioSynthesizer.playChime('click');
    setExtractionStrategy(strat);
    handleParseDocumentText(importedText, strat);
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

  // --- Automatic 10-Question Challenge Quiz compiler ---
  const handleLaunch10QuestionChallenge = () => {
    audioSynthesizer.playChime('complete');
    
    const validCards = extractedPreviewCards
      .filter(c => c.front.trim() && c.back.trim());

    if (validCards.length === 0) {
      alert('Please parse some text or upload a PDF first.');
      return;
    }

    // 1. Gather 10 challenge cards
    let finalChallengeCards = [...validCards];
    
    // Slice if longer than 10
    if (finalChallengeCards.length > 10) {
      finalChallengeCards = finalChallengeCards.sort(() => Math.random() - 0.5).slice(0, 10);
    } 
    // Backfill templates if shorter than 10
    else if (finalChallengeCards.length < 10) {
      const neededCount = 10 - finalChallengeCards.length;
      const shuffledTemplates = [...STUDY_CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
      const addedTemplates = shuffledTemplates.slice(0, neededCount).map((t) => ({
        front: t.front,
        back: t.back
      }));
      finalChallengeCards = [...finalChallengeCards, ...addedTemplates];
    }

    // Formal mapping
    const mappedCards: Flashcard[] = finalChallengeCards.map((c, idx) => ({
      id: `card_challenge_${Date.now()}_${idx}`,
      front: c.front.trim(),
      back: c.back.trim(),
      status: 'new'
    }));

    const challengeTitle = (setName.trim() || `PDF Challenge #${Math.floor(Math.random() * 1000)}`);
    const newSet: FlashcardSet = {
      id: `set_challenge_${Date.now()}`,
      title: challengeTitle + ' 🏆',
      description: setDesc.trim() || `Generated 10-Question timed challenge from ${importFileName || 'pasted document'}.`,
      category: 'Challenge 🏆',
      cards: mappedCards,
      createdAt: Date.now()
    };

    onAddSet(newSet);

    // Reset uploader inputs
    setSetName('');
    setSetDesc('');
    setImportedText('');
    setImportFileName(null);
    setExtractedPreviewCards([]);

    // 2. Launch the challenge quiz instantly (fixed 15 seconds per question!)
    setIsChallengeMode(true);
    setSelectedSetId(newSet.id);
    setQuizTimeLimit(15);
    setQuizTimer(15);
    setQuizIndex(0);
    setQuizSelectedOption(null);
    setQuizIsLocked(false);
    setQuizAnswers([]);
    setQuizTimeSpentTotal(0);
    setQuizFinishedState(false);

    // Compile multiple choice grid
    const compiled = mappedCards.map((card) => {
      const correctAnswer = card.back;
      const otherAnswers = mappedCards
        .filter(c => c.id !== card.id)
        .map(c => c.back);
      
      const shuffledDistractors = otherAnswers.sort(() => Math.random() - 0.5);
      const chosenDistractors = shuffledDistractors.slice(0, 3);
      const options = [correctAnswer, ...chosenDistractors].sort(() => Math.random() - 0.5);

      return {
        id: card.id,
        question: card.front,
        options,
        correctAnswer
      };
    });

    setQuizQuestions(compiled);
    setActiveView('quiz');
  };

  // --- Study (Flip) Session Controls ---
  const handleStartStudy = (setId: string) => {
    audioSynthesizer.playChime('complete');
    const set = flashcardSets.find(s => s.id === setId);
    if (!set || set.cards.length === 0) {
      alert('This flashcard set is empty!');
      return;
    }

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
      
      if (activeSet) {
        const currentCard = studyQueue[studyCardIndex];
        const updatedCards = activeSet.cards.map(c => 
          c.id === currentCard.id ? { ...c, status: 'learning' as const, lastStudied: Date.now() } : c
        );
        onUpdateSetCards(activeSet.id, updatedCards);
      }
    }

    setTimeout(() => {
      setIsCardFlipped(false);
      setTimeout(() => {
        if (studyCardIndex + 1 >= studyQueue.length) {
          audioSynthesizer.playChime('complete');
          setStudyFinished(true);
        } else {
          setStudyCardIndex(prev => prev + 1);
        }
      }, 200);
    }, 100);
  };

  const handleRestartStudy = () => {
    if (!selectedSetId) return;
    handleStartStudy(selectedSetId);
  };

  // --- Quiz Mode (Timer Driven) Session Controls ---
  const handleStartQuizSetup = (setId: string) => {
    audioSynthesizer.playChime('click');
    const set = flashcardSets.find(s => s.id === setId);
    if (!set || set.cards.length < 2) {
      alert('This set needs at least 2 cards to take a quiz.');
      return;
    }
    setIsChallengeMode(false);
    setSelectedSetId(setId);
    setQuizStrategy('mcq');
    setQuestionLimit(Math.min(10, set.cards.length));
    setTimerSetupSeconds(15);
    setShowConfigTimer(true);
  };

  const setupMatchingPairsRound = (allCards: any[], startIndex: number) => {
    const batch = allCards.slice(startIndex, startIndex + 4);
    if (batch.length === 0) return;

    const fronts = batch.map(c => ({
      id: `tile_front_${c.id}_${Date.now()}`,
      text: c.front,
      type: 'front' as const,
      originalCardId: c.id,
      matched: false,
      wrong: false
    }));

    const backs = batch.map(c => ({
      id: `tile_back_${c.id}_${Date.now()}`,
      text: c.back,
      type: 'back' as const,
      originalCardId: c.id,
      matched: false,
      wrong: false
    }));

    const scrambled = [...fronts, ...backs].sort(() => Math.random() - 0.5);
    setMatchingTiles(scrambled);
    setSelectedTileId(null);
  };

  const handleStartQuiz = (
    secondsPerQuestion: number = 15,
    strategy: 'mcq' | 'tf' | 'type_in' | 'matching' = 'mcq',
    limit: number = 10
  ) => {
    const set = flashcardSets.find(s => s.id === selectedSetId);
    if (!set) return;

    setShowConfigTimer(false);
    setQuizStrategy(strategy);
    
    // 0 timer setup means No Timer
    const actualTimeLimit = secondsPerQuestion === 0 ? 9999 : secondsPerQuestion;
    setQuizTimeLimit(actualTimeLimit);
    setQuizTimer(actualTimeLimit);
    
    setQuizIndex(0);
    setQuizSelectedOption(null);
    setQuizIsLocked(false);
    setQuizAnswers([]);
    setQuizTimeSpentTotal(0);
    setQuizFinishedState(false);

    // Question limitation
    let studyCards = [...set.cards].sort(() => Math.random() - 0.5);
    studyCards = studyCards.slice(0, Math.min(limit, studyCards.length));

    if (strategy === 'matching') {
      setupMatchingPairsRound(studyCards, 0);
      
      const dummyQuestions = studyCards.map(c => ({
        id: c.id,
        question: c.front,
        options: [],
        correctAnswer: c.back
      }));
      setQuizQuestions(dummyQuestions);
      setActiveView('quiz');
      return;
    }

    const compiled = studyCards.map((card) => {
      const correctAnswer = card.back;
      const otherAnswers = set.cards
        .filter(c => c.id !== card.id)
        .map(c => c.back);
      
      const shuffledDistractors = otherAnswers.sort(() => Math.random() - 0.5);
      const chosenDistractors = shuffledDistractors.slice(0, 3);
      const options = [correctAnswer, ...chosenDistractors].sort(() => Math.random() - 0.5);

      return {
        id: card.id,
        question: card.front,
        options,
        correctAnswer
      };
    });

    const shuffledQuestions = compiled.sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffledQuestions);

    if (strategy === 'tf') {
      const isCorrectStatement = Math.random() < 0.5;
      setTfStatementCorrect(isCorrectStatement);
      if (isCorrectStatement) {
        setTfDisplayBack(shuffledQuestions[0].correctAnswer);
      } else {
        const distractors = shuffledQuestions.filter(q => q.id !== shuffledQuestions[0].id).map(q => q.correctAnswer);
        const distractor = distractors.length > 0 ? distractors[Math.floor(Math.random() * distractors.length)] : '...';
        setTfDisplayBack(distractor);
      }
    } else if (strategy === 'type_in') {
      setTypedAnswer('');
      setShowTypeInHint(false);
      setTypeInFeedback(null);
    }

    setActiveView('quiz');
  };

  const handleQuizTimeExpired = () => {
    audioSynthesizer.playChime('break');
    setQuizSelectedOption('');
    setQuizIsLocked(true);
    setQuizAnswers(prev => [...prev, { isCorrect: false, timeSpent: quizTimeLimit }]);

    setTimeout(() => {
      advanceQuizQuestion();
    }, 1500);
  };

  const handleQuizSelectOption = (option: string) => {
    if (quizIsLocked) return;

    const currentQuestion = quizQuestions[quizIndex];
    const isCorrect = option === currentQuestion.correctAnswer;

    setQuizSelectedOption(option);
    setQuizIsLocked(true);

    const timeSpent = quizTimeLimit - quizTimer;
    setQuizAnswers(prev => [...prev, { isCorrect, timeSpent }]);

    if (isCorrect) {
      audioSynthesizer.playChime('complete');
    } else {
      audioSynthesizer.playChime('click');
    }

    setTimeout(() => {
      advanceQuizQuestion();
    }, 1500);
  };

  const handleTfAnswer = (userSaysTrue: boolean) => {
    if (quizIsLocked) return;

    const isCorrect = userSaysTrue === tfStatementCorrect;
    setQuizSelectedOption(userSaysTrue ? 'true' : 'false');
    setQuizIsLocked(true);

    const timeSpent = quizTimeLimit - quizTimer;
    setQuizAnswers(prev => [...prev, { isCorrect, timeSpent }]);

    if (isCorrect) {
      audioSynthesizer.playChime('complete');
    } else {
      audioSynthesizer.playChime('click');
    }

    setTimeout(() => {
      advanceQuizQuestion();
    }, 1500);
  };

  const handleTypeInSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (quizIsLocked || !typedAnswer.trim()) return;

    const currentQuestion = quizQuestions[quizIndex];
    const cleanUser = typedAnswer.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = currentQuestion.correctAnswer.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const isCorrect = cleanUser === cleanCorrect;
    setQuizIsLocked(true);
    setTypeInFeedback(isCorrect ? 'correct' : 'wrong');

    const timeSpent = quizTimeLimit - quizTimer;
    setQuizAnswers(prev => [...prev, { isCorrect, timeSpent }]);

    if (isCorrect) {
      audioSynthesizer.playChime('complete');
    } else {
      audioSynthesizer.playChime('click');
    }

    setTimeout(() => {
      advanceQuizQuestion();
    }, 1800);
  };

  const handleRevealTypeInHint = () => {
    audioSynthesizer.playChime('click');
    setShowTypeInHint(true);
  };

  const handleTileClick = (tileId: string) => {
    const tile = matchingTiles.find(t => t.id === tileId);
    if (!tile || tile.matched || tile.wrong) return;

    audioSynthesizer.playChime('click');

    if (selectedTileId === null) {
      setSelectedTileId(tileId);
      return;
    }

    const prevTile = matchingTiles.find(t => t.id === selectedTileId);
    if (!prevTile) {
      setSelectedTileId(tileId);
      return;
    }

    if (prevTile.id === tile.id) {
      setSelectedTileId(null);
      return;
    }

    if (prevTile.originalCardId === tile.originalCardId && prevTile.type !== tile.type) {
      audioSynthesizer.playChime('complete');
      setMatchingTiles(prev => prev.map(t => 
        (t.id === tile.id || t.id === prevTile.id) ? { ...t, matched: true } : t
      ));
      setSelectedTileId(null);

      const newRoundCorrectCount = matchingRoundCorrectCount + 1;
      setMatchingRoundCorrectCount(newRoundCorrectCount);

      const timeSpent = Math.round(quizTimeSpentTotal / (quizAnswers.length + 1));
      setQuizAnswers(prev => [...prev, { isCorrect: true, timeSpent }]);

      const batchStartIndex = quizAnswers.length + 1;
      const isBatchCompleted = (newRoundCorrectCount % 4 === 0) || (batchStartIndex >= quizQuestions.length);

      if (isBatchCompleted) {
        if (batchStartIndex >= quizQuestions.length) {
          setTimeout(() => {
            finishMatchingQuizGame();
          }, 800);
        } else {
          setTimeout(() => {
            setMatchingRoundCorrectCount(0);
            setupMatchingPairsRound(quizQuestions.map(q => ({ front: q.question, back: q.correctAnswer, id: q.id })), batchStartIndex);
          }, 800);
        }
      }
    } else {
      audioSynthesizer.playChime('break');
      setMatchingTiles(prev => prev.map(t => 
        (t.id === tile.id || t.id === prevTile.id) ? { ...t, wrong: true } : t
      ));
      setSelectedTileId(null);
      setQuizAnswers(prev => [...prev, { isCorrect: false, timeSpent: 2 }]);

      setTimeout(() => {
        setMatchingTiles(prev => prev.map(t => 
          (t.id === tile.id || t.id === prevTile.id) ? { ...t, wrong: false } : t
        ));
      }, 400);
    }
  };

  const finishMatchingQuizGame = () => {
    audioSynthesizer.playChime('complete');
    
    const totalQuestions = quizQuestions.length;
    const totalAttemptsCount = quizAnswers.length;
    const totalCorrect = totalQuestions;
    const accuracy = totalAttemptsCount > 0 ? Math.round((totalCorrect / totalAttemptsCount) * 100) : 100;
    const totalTime = quizTimeSpentTotal;
    const averageSpeed = totalQuestions > 0 ? Number((totalTime / totalQuestions).toFixed(1)) : 0;

    const speedScore = Math.max(0, 100 - (averageSpeed * 4));
    const efficiencyScore = Math.round((accuracy * 0.7) + (speedScore * 0.3));

    const newAttempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      setId: selectedSetId || '',
      setTitle: activeSet?.title || 'Unknown Quiz',
      score: totalCorrect,
      totalQuestions,
      timeSpent: totalTime,
      averageSpeed,
      accuracy,
      efficiencyScore,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      strategy: quizStrategy
    };

    onLogAttempt(newAttempt);
    setQuizFinishedState(true);
  };

  const advanceQuizQuestion = () => {
    if (quizIndex + 1 >= quizQuestions.length) {
      audioSynthesizer.playChime('complete');

      const totalCorrect = quizAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = quizQuestions.length;
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const totalTime = quizTimeSpentTotal;
      const averageSpeed = totalQuestions > 0 ? Number((totalTime / totalQuestions).toFixed(1)) : 0;

      const speedScore = Math.max(0, 100 - (averageSpeed * 4));
      const efficiencyScore = Math.round((accuracy * 0.7) + (speedScore * 0.3));

      const newAttempt: QuizAttempt = {
        id: `attempt_${Date.now()}`,
        setId: selectedSetId || '',
        setTitle: activeSet?.title || 'Unknown Quiz',
        score: totalCorrect,
        totalQuestions,
        timeSpent: totalTime,
        averageSpeed,
        accuracy,
        efficiencyScore,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        strategy: quizStrategy
      };

      onLogAttempt(newAttempt);
      setQuizFinishedState(true);
    } else {
      const nextIndex = quizIndex + 1;
      setQuizIndex(nextIndex);
      setQuizTimer(quizTimeLimit);
      setQuizSelectedOption(null);
      setQuizIsLocked(false);

      if (quizStrategy === 'tf') {
        const isCorrectStatement = Math.random() < 0.5;
        setTfStatementCorrect(isCorrectStatement);
        if (isCorrectStatement) {
          setTfDisplayBack(quizQuestions[nextIndex].correctAnswer);
        } else {
          const distractors = quizQuestions.filter(q => q.id !== quizQuestions[nextIndex].id).map(q => q.correctAnswer);
          const distractor = distractors.length > 0 ? distractors[Math.floor(Math.random() * distractors.length)] : '...';
          setTfDisplayBack(distractor);
        }
      } else if (quizStrategy === 'type_in') {
        setTypedAnswer('');
        setShowTypeInHint(false);
        setTypeInFeedback(null);
      }
    }
  };

  const handleRestartQuiz = () => {
    handleStartQuiz(quizTimeLimit === 9999 ? 0 : quizTimeLimit, quizStrategy, questionLimit);
  };

  // --- STATS COMPUTATIONS (Efficiency tracker) ---
  const totalAttempts = quizAttempts.length;
  const avgAccuracy = totalAttempts > 0 
    ? Math.round(quizAttempts.reduce((acc, curr) => acc + curr.accuracy, 0) / totalAttempts) 
    : 0;
  const avgSpeed = totalAttempts > 0 
    ? Number((quizAttempts.reduce((acc, curr) => acc + curr.averageSpeed, 0) / totalAttempts).toFixed(1)) 
    : 0;
  const avgEfficiency = totalAttempts > 0 
    ? Math.round(quizAttempts.reduce((acc, curr) => acc + curr.efficiencyScore, 0) / totalAttempts) 
    : 0;

  // Grade helper
  const getGradeString = (accuracy: number) => {
    if (accuracy >= 95) return 'A+ 🏆';
    if (accuracy >= 85) return 'A ⭐';
    if (accuracy >= 75) return 'B 🌸';
    if (accuracy >= 60) return 'C ☕';
    return 'D 📚';
  };

  // --- RENDER MODES ---

  // 1. DASHBOARD MODE
  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="cute-title">Study Hub 🌸</h1>
          <p className="cute-subtitle">Quiz timers & document extraction</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { audioSynthesizer.playChime('click'); setActiveView('efficiency'); }}
            className="btn-circle animate-pulse"
            style={{ backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            title="View efficiency tracker logs"
          >
            <TrendingUp size={16} />
          </button>
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
            title="Upload document/extract"
          >
            <Upload size={18} />
          </button>
        </div>
      </div>

      {flashcardSets.length === 0 ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', gap: '10px', textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Study Sets Yet</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '80%' }}>
            Upload documents (PDFs), parse definition sheets, or compile custom flashcards and time-restricted quizzes offline!
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="btn-cute" onClick={() => setActiveView('import')}>
              <Sparkles size={14} /> Smart Extract
            </button>
            <button className="btn-cute btn-cute-secondary" onClick={() => setActiveView('create')}>
              Manually Create
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {flashcardSets.map(set => {
            const masteredCount = set.cards.filter(c => c.status === 'mastered').length;
            const progressPct = set.cards.length > 0 ? (masteredCount / set.cards.length) * 100 : 0;
            const isSetChallenge = set.category === 'Challenge 🏆';
            
            return (
              <div
                key={set.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative',
                  border: isSetChallenge ? '1.5px solid #f5b041' : '1.5px solid var(--glass-border)',
                  boxShadow: isSetChallenge ? '0 4px 15px rgba(245, 176, 65, 0.12)' : 'var(--panel-shadow)'
                }}
              >
                {/* Actions */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => {
                      if (isSetChallenge) {
                        setSelectedSetId(set.id);
                        handleStartQuiz(15);
                      } else {
                        handleStartQuizSetup(set.id);
                      }
                    }}
                    className="btn-circle"
                    style={{ width: '28px', height: '28px', backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)' }}
                    title={isSetChallenge ? "Launch 10-Question Speed Challenge" : "Take Timer Quiz"}
                  >
                    <Timer size={13} style={{ color: 'var(--accent)' }} />
                  </button>
                  <button
                    onClick={() => handleStartStudy(set.id)}
                    className="btn-circle"
                    style={{ width: '28px', height: '28px' }}
                    title="Study Flashcards"
                  >
                    <BookOpen size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audioSynthesizer.playChime('click');
                      if (confirm(`Delete the set "${set.title}"?`)) onDeleteSet(set.id);
                    }}
                    className="btn-circle"
                    style={{ width: '28px', height: '28px', borderColor: 'transparent', background: 'transparent', color: 'var(--text-secondary)' }}
                  >
                    <Trash2 size={13} className="delete-icon-hover" />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-medium" style={{ fontSize: '9px', padding: '2px 8px', backgroundColor: isSetChallenge ? '#fdf5df' : '#fef3c7', color: isSetChallenge ? '#e69d24' : '#d97706' }}>
                    {set.category || 'General'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {set.cards.length} items
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', width: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {set.title}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', maxWidth: '85%' }}>
                  {set.description || 'No description.'}
                </p>

                {/* Progress */}
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>Studied</span>
                    <span>{masteredCount} / {set.cards.length} Mastered</span>
                  </div>
                  <div style={{ height: '5px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: 'var(--accent)', borderRadius: '4px', transition: 'var(--transition-smooth)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini summary card linking to tracking */}
      {quizAttempts.length > 0 && (
        <div 
          onClick={() => { audioSynthesizer.playChime('click'); setActiveView('efficiency'); }}
          className="glass-panel" 
          style={{ justifySelf: 'center', margin: 0, padding: '12px 16px', cursor: 'pointer', border: '1.5px dashed var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Efficiency Score: {avgEfficiency}/100</span>
              <p style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Based on last {totalAttempts} quiz attempts</p>
            </div>
          </div>
          <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
        </div>
      )}
    </div>
  );

  // 2. STUDY MODE (FLIP CARDS)
  const renderStudyMode = () => {
    if (!activeSet || studyQueue.length === 0) return null;
    const currentCard = studyQueue[studyCardIndex];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Cards: {activeSet.title}</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Practice Deck</span>
          </div>
        </div>

        {studyFinished ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 16px', textAlign: 'center', gap: '12px' }}>
            <div style={{ fontSize: '48px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>Deck Completed!</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '80%' }}>You studied all cards in this deck. Let's see your cards breakdown:</p>
            <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>{studyRightCount}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>MASTERED ✅</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#e11d48' }}>{studyWrongCount}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>RETRY ❌</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '10px' }}>
              <button className="btn-cute" onClick={handleRestartStudy}><RefreshCw size={14} /> Study Again</button>
              <button className="btn-cute btn-cute-secondary" onClick={() => setActiveView('sets')}>Back to Hub</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Card {studyCardIndex + 1} of {studyQueue.length}</span>
                <span>{Math.round(((studyCardIndex) / studyQueue.length) * 100)}% Done</span>
              </div>
              <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((studyCardIndex) / studyQueue.length) * 100}%`, backgroundColor: 'var(--accent)', transition: 'var(--transition-smooth)' }} />
              </div>
            </div>

            <div
              className={`flashcard-3d-container ${isCardFlipped ? 'flipped' : ''}`}
              onClick={() => { audioSynthesizer.playChime('click'); setIsCardFlipped(!isCardFlipped); }}
            >
              <div className="flashcard-3d-card">
                <div className="flashcard-front glass-panel">
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Concept / Term</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', overflowY: 'auto', maxHeight: '80%', padding: '0 8px', lineBreak: 'anywhere' }}>{currentCard.front}</div>
                  <span style={{ position: 'absolute', bottom: '12px', fontSize: '9px', color: 'var(--text-secondary)', opacity: 0.6, fontWeight: 700 }}>💡 Click to reveal definition</span>
                </div>
                <div className="flashcard-back glass-panel">
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', opacity: 0.7, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Definition</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', overflowY: 'auto', maxHeight: '80%', padding: '0 8px', lineBreak: 'anywhere' }}>{currentCard.back}</div>
                  <span style={{ position: 'absolute', bottom: '12px', fontSize: '9px', color: 'var(--accent)', opacity: 0.7, fontWeight: 700 }}>🌸 Bujjithalli Study Desk</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button onClick={() => handleStudyAction(false)} className="btn-cute btn-cute-secondary" style={{ flex: 1, padding: '12px', borderRadius: '16px', backgroundColor: '#ffe4e6', color: '#e11d48', borderColor: 'rgba(225,29,72,0.1)' }}><X size={16} /> Needs Work</button>
              <button onClick={() => handleStudyAction(true)} className="btn-cute" style={{ flex: 1, padding: '12px', borderRadius: '16px', backgroundColor: '#dcfce7', color: '#16a34a' }}><Check size={16} /> Got It!</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. QUIZ MODE (TIMER DRIVEN MCQ)
  const renderQuizMode = () => {
    if (!activeSet || quizQuestions.length === 0) return null;
    const currentQuestion = quizQuestions[quizIndex];

    const getStrategyLabel = () => {
      if (isChallengeMode) return '🏆 Speed Challenge';
      switch (quizStrategy) {
        case 'mcq': return '⚡ Classic MCQ';
        case 'tf': return '❓ True or False';
        case 'type_in': return '✍️ Type-In Answer';
        case 'matching': return '🧩 Matching Pairs';
        default: return 'Timer MCQ';
      }
    };

    const renderQuizResults = () => {
      const totalCorrect = quizStrategy === 'matching' ? quizQuestions.length : quizAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = quizQuestions.length;
      const accuracy = quizStrategy === 'matching' 
        ? (quizAnswers.length > 0 ? Math.round((totalCorrect / quizAnswers.length) * 100) : 100)
        : (totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0);
      const totalTime = quizTimeSpentTotal;
      const averageSpeed = totalQuestions > 0 ? Number((totalTime / totalQuestions).toFixed(1)) : 0;

      return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', textAlign: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
            <Award size={36} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-cute)', color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
            {getStrategyLabel()} Completed!
          </h2>
          
          <div style={{ padding: '8px 18px', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>RATING GRADE</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
              {getGradeString(accuracy)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', margin: '6px 0' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '10px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>SCORE ACCURACY</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalCorrect} / {totalQuestions} ({accuracy}%)
              </span>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '10px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>AVERAGE SPEED</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {averageSpeed}s / Q
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
            <button className="btn-cute" onClick={handleRestartQuiz}><RefreshCw size={14} /> Retake Game</button>
            <button className="btn-cute btn-cute-secondary" onClick={() => setActiveView('sets')}>Back to Dashboard</button>
          </div>
        </div>
      );
    };

    if (quizStrategy === 'matching') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
              <ArrowLeft size={14} />
            </button>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                🧩 Matchmaker: {activeSet.title}
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Tap a Concept tile and its correct Definition tile!
              </span>
            </div>
          </div>

          {quizFinishedState ? (
            renderQuizResults()
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Progress & Stat Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Matched: {quizAnswers.filter(a => a.isCorrect).length} / {quizQuestions.length}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                  ⏳ Time Elapsed: {quizTimeSpentTotal}s
                </span>
              </div>
              
              <div style={{ height: '5px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${(quizAnswers.filter(a => a.isCorrect).length / quizQuestions.length) * 100}%`, 
                    backgroundColor: 'var(--accent)',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>

              {/* Matchmaker Tiles Board */}
              <div className="matching-pairs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', flex: 1, overflowY: 'auto' }}>
                {matchingTiles.map((tile) => {
                  const isSelected = selectedTileId === tile.id;
                  const isMatched = tile.matched;
                  const isWrong = tile.wrong;

                  let tileClass = 'matching-tile';
                  if (isSelected) tileClass += ' selected';
                  if (isMatched) tileClass += ' matched';
                  if (isWrong) tileClass += ' wrong';

                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleTileClick(tile.id)}
                      className={tileClass}
                      disabled={isMatched || isWrong}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 700 }}>
                        {tile.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isChallengeMode ? `🏆 Challenge: ${activeSet.title}` : `Quiz: ${activeSet.title}`}
            </h3>
            <span style={{ fontSize: '10px', color: isChallengeMode ? 'var(--accent-hover)' : 'var(--text-secondary)', fontWeight: 700 }}>
              {getStrategyLabel()}
            </span>
          </div>
        </div>

        {quizFinishedState ? (
          renderQuizResults()
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {/* Progress & Countdown timers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Question {quizIndex + 1} of {quizQuestions.length}</span>
                {quizTimeLimit < 100 ? (
                  <span style={{ color: quizTimer <= 4 ? '#e11d48' : 'var(--text-secondary)', fontWeight: 700 }}>
                    ⏳ {quizTimer}s remaining
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                    ⏳ Self-paced (No Timer)
                  </span>
                )}
              </div>
              
              {quizTimeLimit < 100 && (
                <div style={{ height: '5px', width: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${(quizTimer / quizTimeLimit) * 100}%`, 
                      backgroundColor: quizTimer <= 4 ? '#e11d48' : quizTimer <= 8 ? '#f5b041' : '#10b981', 
                      transition: 'width 1s linear' 
                    }} 
                  />
                </div>
              )}
            </div>

            {/* Question card */}
            <div 
              className={`glass-panel ${isChallengeMode ? 'challenge-box-glow' : ''}`} 
              style={{ 
                padding: '24px 16px', 
                minHeight: '120px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center', 
                position: 'relative',
                border: isChallengeMode ? '2px solid #f5b041' : '1.5px solid var(--glass-border)',
                boxShadow: isChallengeMode ? '0 0 15px rgba(245, 176, 65, 0.22)' : 'var(--panel-shadow)'
              }}
            >
              <span style={{ position: 'absolute', top: '8px', left: '10px', fontSize: '9px', fontWeight: 700, color: isChallengeMode ? '#f5b041' : 'var(--text-secondary)', opacity: 0.8 }}>
                {isChallengeMode ? '🏆 CHALLENGE STATEMENT' : 'CONCEPT / QUESTION'}
              </span>
              <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineBreak: 'anywhere' }}>
                {currentQuestion.question}
              </p>

              {quizStrategy === 'tf' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', marginTop: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '7px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.5px' }}>ASSOCIATED DEFINITION</span>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineBreak: 'anywhere' }}>
                    {tfDisplayBack}
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Answer Views */}
            {quizStrategy === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = quizSelectedOption === opt;
                  const isCorrect = opt === currentQuestion.correctAnswer;
                  const showWrongFeedback = quizIsLocked && isSelected && !isCorrect;
                  const showRightFeedback = quizIsLocked && isCorrect;
                  
                  let optStyle: React.CSSProperties = {
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    border: '1.5px solid var(--glass-border)',
                    backgroundColor: 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: quizIsLocked ? 'default' : 'pointer',
                    transition: 'var(--transition-smooth)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  };

                  if (showRightFeedback) {
                    optStyle = { ...optStyle, backgroundColor: '#dcfce7', borderColor: '#16a34a', color: '#15803d', borderWidth: '2px' };
                  } else if (showWrongFeedback) {
                    optStyle = { ...optStyle, backgroundColor: '#ffe4e6', borderColor: '#e11d48', color: '#be123c', borderWidth: '2px' };
                  } else if (isSelected) {
                    optStyle = { ...optStyle, borderColor: 'var(--accent)', backgroundColor: 'var(--accent-light)' };
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizSelectOption(opt)}
                      style={optStyle}
                      disabled={quizIsLocked}
                    >
                      <span>{idx + 1}. {opt}</span>
                      {showRightFeedback && <Check size={14} style={{ color: '#16a34a' }} />}
                      {showWrongFeedback && <X size={14} style={{ color: '#e11d48' }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {quizStrategy === 'tf' && (
              <div className="tf-buttons" style={{ marginTop: 'auto' }}>
                <button 
                  className="btn-tf btn-tf-false" 
                  onClick={() => handleTfAnswer(false)}
                  disabled={quizIsLocked}
                  style={quizIsLocked && quizSelectedOption === 'false' && !tfStatementCorrect ? { borderWidth: '2.5px' } : {}}
                >
                  ❌ FALSE
                </button>
                <button 
                  className="btn-tf btn-tf-true" 
                  onClick={() => handleTfAnswer(true)}
                  disabled={quizIsLocked}
                  style={quizIsLocked && quizSelectedOption === 'true' && tfStatementCorrect ? { borderWidth: '2.5px' } : {}}
                >
                  ✅ TRUE
                </button>
              </div>
            )}

            {quizStrategy === 'type_in' && (
              <form onSubmit={handleTypeInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: 'auto' }}>
                <input
                  type="text"
                  placeholder={quizIsLocked ? 'Question answered' : 'Type the exact answer...'}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={quizIsLocked}
                  className="input-cute"
                  style={{
                    padding: '12px 14px',
                    fontSize: '12px',
                    textAlign: 'center',
                    borderWidth: '2px',
                    borderColor: typeInFeedback === 'correct' ? '#16a34a' : typeInFeedback === 'wrong' ? '#e11d48' : 'var(--glass-border)',
                    backgroundColor: typeInFeedback === 'correct' ? '#dcfce7' : typeInFeedback === 'wrong' ? '#ffe4e6' : 'var(--glass-bg)',
                    color: typeInFeedback === 'correct' ? '#15803d' : typeInFeedback === 'wrong' ? '#be123c' : 'var(--text-primary)'
                  }}
                  autoFocus
                />

                {quizIsLocked && (
                  <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: typeInFeedback === 'correct' ? '#16a34a' : '#e11d48', padding: '4px' }}>
                    {typeInFeedback === 'correct' ? '🎉 Got it correct!' : `❌ Answer: ${currentQuestion.correctAnswer}`}
                  </div>
                )}

                {!quizIsLocked && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleRevealTypeInHint}
                      className="btn-cute btn-cute-secondary"
                      style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                      disabled={showTypeInHint}
                    >
                      💡 Hint
                    </button>
                    <button
                      type="submit"
                      className="btn-cute"
                      style={{ flex: 2, padding: '10px', fontSize: '12px' }}
                    >
                      Submit Answer
                    </button>
                  </div>
                )}

                {showTypeInHint && (
                  <div className="hint-container">
                    <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '3px' }}>HINT CHARACTER GRID:</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
                      {currentQuestion.correctAnswer.charAt(0).toUpperCase()}
                      {Array(Math.max(1, currentQuestion.correctAnswer.length - 1)).fill('_').join(' ')} 
                      &nbsp;({currentQuestion.correctAnswer.length} letters)
                    </span>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  // 4. EFFICIENCY TRACKER VIEW (WITH TREND CHARTS)
  const renderEfficiencyView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
          <ArrowLeft size={14} />
        </button>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Efficiency Tracker</h3>
      </div>

      {quizAttempts.length === 0 ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', gap: '10px', textAlign: 'center' }}>
          <Activity size={36} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>No attempts recorded yet</h4>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Take quizzes with timer bounds to track your response speed, accuracy, and study metrics over time!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
          {/* Summary metrics header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div className="glass-panel" style={{ padding: '10px 4px', textAlign: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Efficiency</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>{avgEfficiency}%</span>
            </div>
            <div className="glass-panel" style={{ padding: '10px 4px', textAlign: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Accuracy</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>{avgAccuracy}%</span>
            </div>
            <div className="glass-panel" style={{ padding: '10px 4px', textAlign: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Speed</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)' }}>{avgSpeed}s</span>
            </div>
          </div>

          {/* HTML/CSS Cozy trends bar chart */}
          <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} style={{ color: 'var(--accent)' }} /> Learning Efficiency History (Last 7 Attempts)
            </span>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px', padding: '10px 0 2px 0', borderBottom: '1px dashed var(--glass-border)' }}>
              {quizAttempts.slice(0, 7).reverse().map((att, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    width: '24px', 
                    position: 'relative' 
                  }}
                  title={`Quiz: ${att.setTitle}\nEfficiency: ${att.efficiencyScore}%\nSpeed: ${att.averageSpeed}s`}
                >
                  <span style={{ fontSize: '7px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '3px' }}>{att.efficiencyScore}</span>
                  <div 
                    style={{ 
                      height: `${Math.max(8, att.efficiencyScore * 0.7)}px`, 
                      width: '12px', 
                      backgroundColor: att.efficiencyScore >= 80 ? '#10b981' : att.efficiencyScore >= 60 ? 'var(--accent)' : '#eb9e22', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.8s ease-out'
                    }} 
                  />
                  <span style={{ fontSize: '7px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 700 }}>#{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* List of quiz attempts logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} style={{ color: 'var(--accent)' }} /> Detailed Study Logs
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
              {quizAttempts.map((att, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                  <div style={{ width: '60%', overflow: 'hidden' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {att.setTitle}
                    </span>
                    <span style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      🕒 {att.date} • speed {att.averageSpeed}s/Q
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="badge badge-low" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: att.accuracy >= 75 ? '#dcfce7' : '#ffe4e6', color: att.accuracy >= 75 ? '#16a34a' : '#e11d48' }}>
                      {att.accuracy}% acc
                    </span>
                    <span className="badge badge-high" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: 'var(--accent-light)', color: 'var(--text-primary)' }}>
                      index: {att.efficiencyScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 5. MANUAL SET CREATOR
  const renderCreateSet = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
          <ArrowLeft size={14} />
        </button>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>New Study Set</h3>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Set Name</label>
          <input
            type="text"
            placeholder="e.g. SSC Polity & Amendments 🏛️"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            className="input-cute"
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
          <input
            type="text"
            placeholder="Brief summaries or formula details"
            value={setDesc}
            onChange={(e) => setSetDesc(e.target.value)}
            className="input-cute"
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>Cards</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
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
              <input
                type="text"
                placeholder="Term / Question"
                value={card.front}
                onChange={(e) => handleManualCardChange(idx, 'front', e.target.value)}
                className="input-cute"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
              <input
                type="text"
                placeholder="Definition / Answer"
                value={card.back}
                onChange={(e) => handleManualCardChange(idx, 'back', e.target.value)}
                className="input-cute"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
          ))}
        </div>
        <button className="btn-cute btn-cute-secondary" onClick={handleAddManualCardRow} style={{ padding: '8px' }}><Plus size={14} /> Add Card Row</button>
        <button className="btn-cute" onClick={handleSaveManualSet} style={{ marginTop: '4px' }}>Save Set 🌸</button>
      </div>
    </div>
  );

  // 6. DOCUMENT PARSE & SMART EXTRACTION (PDF supported!)
  const renderImportSet = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => { audioSynthesizer.playChime('click'); setActiveView('sets'); }}>
          <ArrowLeft size={14} />
        </button>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Document Extractor</h3>
      </div>

      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} style={{ color: 'var(--accent)' }} /> Extract terms automatically from PDF books, notes, or raw texts!
        </span>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 10px',
            border: '2px dashed var(--glass-border)',
            borderRadius: '16px',
            cursor: isParsingPdf ? 'default' : 'pointer',
            backgroundColor: isParsingPdf ? 'rgba(0,0,0,0.03)' : 'rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            transition: 'var(--transition-smooth)'
          }}
        >
          <FileText size={24} style={{ color: 'var(--text-secondary)', marginBottom: '6px' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isParsingPdf ? '⏳ Reading PDF via Browser Engine...' : importFileName ? `Selected: ${importFileName}` : 'Upload File (.pdf, .txt, .csv, .json)'}
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>Runs 100% locally. PDF.js CDN parsed. Max 5MB.</span>
          <input
            type="file"
            accept=".txt,.csv,.json,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={isParsingPdf}
          />
        </label>

        {importError && (
          <div style={{ color: '#e11d48', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> {importError}
          </div>
        )}

        {/* Strategy Selector Capsules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Choose Extraction Strategy:
          </label>
          <div className="strategy-capsules">
            <button
              onClick={() => handleStrategyChange('pairs')}
              className={`strategy-capsule ${extractionStrategy === 'pairs' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '16px' }}>📑</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="strategy-title">Definition Pairs</span>
                <span className="strategy-desc">Finds concepts split by dashes, colons, or equals.</span>
              </div>
            </button>
            <button
              onClick={() => handleStrategyChange('summarize')}
              className={`strategy-capsule ${extractionStrategy === 'summarize' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '16px' }}>🧠</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="strategy-title">Concept & Fact Summarizer</span>
                <span className="strategy-desc">Extracts key sentences and fact predicates using copulas (is/are).</span>
              </div>
            </button>
            <button
              onClick={() => handleStrategyChange('cloze')}
              className={`strategy-capsule ${extractionStrategy === 'cloze' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '16px' }}>✍️</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="strategy-title">Cloze Deletions</span>
                <span className="strategy-desc">Blanks out important nouns with "______" for context testing.</span>
              </div>
            </button>
            <button
              onClick={() => handleStrategyChange('qa')}
              className={`strategy-capsule ${extractionStrategy === 'qa' ? 'active' : ''}`}
            >
              <div style={{ fontSize: '16px' }}>❓</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="strategy-title">Q&A Generator</span>
                <span className="strategy-desc">Pairs question sentences ending in "?" with their responses.</span>
              </div>
            </button>
          </div>
        </div>

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
              handleParseDocumentText(e.target.value, extractionStrategy);
            }}
            className="input-cute"
            rows={4}
            style={{ resize: 'vertical', fontSize: '11px', fontFamily: 'var(--font-main)' }}
          />
        </div>
      </div>

      {extractedPreviewCards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} /> Extracted Preview ({extractedPreviewCards.length})
          </h4>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Challenge Set Title (e.g. History notes)"
              className="input-cute"
              style={{ padding: '6px 10px', fontSize: '12px' }}
            />
            
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

          {/* Sideloaded Timed Challenge launcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className="btn-cute animate-pulse" 
              onClick={handleLaunch10QuestionChallenge}
              style={{ padding: '12px', background: 'var(--accent)', border: 'none', color: 'white', display: 'flex', gap: '6px', justifyContent: 'center' }}
            >
              <Sparkles size={14} /> Launch 10-Q Challenge! 🏆
            </button>
            <button 
              className="btn-cute btn-cute-secondary" 
              onClick={handleSaveImportedSet}
              style={{ padding: '10px' }}
            >
              Save Deck Normally 🌸
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // SWITCH RENDERS
  return (
    <>
      {activeView === 'sets' && renderDashboard()}
      {activeView === 'study' && renderStudyMode()}
      {activeView === 'quiz' && renderQuizMode()}
      {activeView === 'create' && renderCreateSet()}
      {activeView === 'import' && renderImportSet()}
      {activeView === 'efficiency' && renderEfficiencyView()}

      {/* Quiz Configuration Modal */}
      {showConfigTimer && (
        <div className="modal-backdrop" onClick={() => setShowConfigTimer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
                  Quiz Strategy & Rules 🌸
                </h3>
              </div>
              <button className="btn-circle" style={{ width: '32px', height: '32px', fontSize: '12px' }} onClick={() => setShowConfigTimer(false)}>x</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Strategy Selector */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Quiz Strategy
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'mcq' as const, label: '⚡ Classic MCQ', desc: '4 choice options' },
                    { id: 'tf' as const, label: '❓ True/False', desc: 'Verify associations' },
                    { id: 'type_in' as const, label: '✍️ Type-In', desc: 'Spell key definition' },
                    { id: 'matching' as const, label: '🧩 Matching Pairs', desc: 'Grid board match' }
                  ].map(strat => (
                    <button
                      key={strat.id}
                      onClick={() => {
                        audioSynthesizer.playChime('click');
                        setQuizStrategy(strat.id);
                      }}
                      className="btn-cute"
                      style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 4px', 
                        borderRadius: '16px',
                        backgroundColor: quizStrategy === strat.id ? 'var(--accent)' : 'var(--glass-bg)',
                        color: quizStrategy === strat.id ? 'white' : 'var(--text-primary)',
                        border: '1.5px solid var(--glass-border)',
                        fontSize: '11px',
                        boxShadow: quizStrategy === strat.id ? '0 4px 12px rgba(255, 158, 187, 0.2)' : 'none'
                      }}
                    >
                      <span style={{ fontWeight: 800 }}>{strat.label}</span>
                      <span style={{ fontSize: '8px', opacity: 0.8, marginTop: '2px', fontWeight: 500 }}>{strat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Config */}
              {quizStrategy !== 'matching' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Timer Bounds
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { val: 10, label: '⏳ 10s' },
                      { val: 15, label: '⏳ 15s' },
                      { val: 30, label: '⏳ 30s' },
                      { val: 0, label: '🌸 Relaxed' }
                    ].map(sec => (
                      <button
                        key={sec.val}
                        onClick={() => {
                          audioSynthesizer.playChime('click');
                          setTimerSetupSeconds(sec.val);
                        }}
                        className="btn-cute"
                        style={{ 
                          flex: 1, 
                          padding: '8px 0', 
                          borderRadius: '12px',
                          backgroundColor: timerSetupSeconds === sec.val ? 'var(--accent)' : 'var(--glass-bg)',
                          color: timerSetupSeconds === sec.val ? 'white' : 'var(--text-primary)',
                          border: '1.5px solid var(--glass-border)',
                          fontSize: '11px'
                        }}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Count limit */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Deck Coverage (Questions count)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[5, 10, 15, 999].map(num => {
                    const setObj = flashcardSets.find(s => s.id === selectedSetId);
                    const deckSize = setObj ? setObj.cards.length : 10;
                    const val = num === 999 ? deckSize : Math.min(num, deckSize);
                    const label = num === 999 ? 'All' : `${num} Cards`;
                    const isSelected = questionLimit === val || (num === 999 && questionLimit >= deckSize);

                    return (
                      <button
                        key={num}
                        onClick={() => {
                          audioSynthesizer.playChime('click');
                          setQuestionLimit(val);
                        }}
                        className="btn-cute"
                        style={{ 
                          flex: 1, 
                          padding: '8px 0', 
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'var(--accent)' : 'var(--glass-bg)',
                          color: isSelected ? 'white' : 'var(--text-primary)',
                          border: '1.5px solid var(--glass-border)',
                          fontSize: '11px'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <button 
                className="btn-cute animate-pulse" 
                style={{ marginTop: '8px', padding: '12px', background: 'var(--accent)', border: 'none', color: 'white' }} 
                onClick={() => handleStartQuiz(timerSetupSeconds, quizStrategy, questionLimit)}
              >
                Launch Game Setup 🌸
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default FlashcardsView;
