import React, { useState } from 'react';
import { Search, ClipboardList, Calendar, Edit3, Save, X } from 'lucide-react';
import type { SyllabusSubject, SyllabusTopic } from '../types';
import { audioSynthesizer } from './AudioSynthesizer';

interface SyllabusTrackerProps {
  syllabus: SyllabusSubject[];
  onUpdateTopic: (subjectId: string, topicId: string, updatedTopic: Partial<SyllabusTopic>) => void;
}

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({ syllabus, onUpdateTopic }) => {
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('quantitative-aptitude');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');

  // Modal Editor state
  const [selectedTopic, setSelectedTopic] = useState<{ subjectId: string; topic: SyllabusTopic } | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editRevision, setEditRevision] = useState<SyllabusTopic['revisionStatus']>('not_revised');
  const [editTargetDate, setEditTargetDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<SyllabusTopic['status']>('pending');

  const currentSubject = syllabus.find(s => s.id === activeSubjectTab);

  // Quick checkbox toggle completion
  const handleToggleComplete = (subjectId: string, topic: SyllabusTopic, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening editor modal
    const nextStatus: SyllabusTopic['status'] = topic.status === 'completed' ? 'pending' : 'completed';

    if (nextStatus === 'completed') {
      audioSynthesizer.playChime('complete');
    } else {
      audioSynthesizer.playChime('click');
    }

    onUpdateTopic(subjectId, topic.id, { status: nextStatus });
  };

  // Open editor modal
  const handleOpenEditor = (subjectId: string, topic: SyllabusTopic) => {
    audioSynthesizer.playChime('click');
    setSelectedTopic({ subjectId, topic });
    setEditNotes(topic.notes);
    setEditRevision(topic.revisionStatus);
    setEditTargetDate(topic.targetDate || '');
    setEditStatus(topic.status);
  };

  // Save modal edits
  const handleSaveEdits = () => {
    if (!selectedTopic) return;

    audioSynthesizer.playChime('complete');
    onUpdateTopic(selectedTopic.subjectId, selectedTopic.topic.id, {
      notes: editNotes,
      revisionStatus: editRevision,
      targetDate: editTargetDate || undefined,
      status: editStatus
    });

    setSelectedTopic(null);
  };

  // Filter topics based on search query and subcategory
  const filteredTopics = currentSubject
    ? currentSubject.topics.filter(topic => {
      const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubcategory = activeSubcategory === 'All' || topic.category === activeSubcategory;
      return matchesSearch && matchesSubcategory;
    })
    : [];

  // Count progress for selected subcategory
  const filteredSubcategoryTopics = currentSubject
    ? currentSubject.topics.filter(t => activeSubcategory === 'All' || t.category === activeSubcategory)
    : [];
  const subjectTotal = filteredSubcategoryTopics.length;
  const subjectDone = filteredSubcategoryTopics.filter(t => t.status === 'completed').length;
  const subjectPercent = subjectTotal > 0 ? Math.round((subjectDone / subjectTotal) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Subject Selector Header Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', margin: '0 -4px' }}>
        {syllabus.map(subj => (
          <button
            key={subj.id}
            onClick={() => {
              audioSynthesizer.playChime('click');
              setActiveSubjectTab(subj.id);
              setActiveSubcategory('All');
            }}
            className="btn-cute"
            style={{
              padding: '8px 12px',
              fontSize: '11px',
              flexShrink: 0,
              backgroundColor: activeSubjectTab === subj.id ? 'var(--accent)' : 'var(--glass-bg)',
              color: activeSubjectTab === subj.id ? 'white' : 'var(--text-primary)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: '14px',
              boxShadow: activeSubjectTab === subj.id ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {subj.name === 'Quantitative Aptitude' ? '📐 Quant' :
              subj.name === 'General Intelligence & Reasoning' ? '🧠 Reason' :
                subj.name === 'English Language & Comprehension' ? '✍️ English' : '🌍 GK'}
          </button>
        ))}
      </div>

      {/* GK Sub-category Filter Bar */}
      {activeSubjectTab === 'general-awareness' && (
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          margin: '2px -4px 6px -4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {['All', 'History', 'Geography', 'Polity', 'Economics', 'Science', 'Current Affairs', 'Static GK', 'Environment', 'Computer'].map(cat => {
            const isActive = activeSubcategory === cat;
            let emoji = '🌍';
            if (cat === 'History') emoji = '🏛️';
            if (cat === 'Geography') emoji = '🏔️';
            if (cat === 'Polity') emoji = '⚖️';
            if (cat === 'Economics') emoji = '📈';
            if (cat === 'Science') emoji = '🧪';
            if (cat === 'Current Affairs') emoji = '📅';
            if (cat === 'Static GK') emoji = '🗿';
            if (cat === 'Environment') emoji = '🌿';
            if (cat === 'Computer') emoji = '💻';
            if (cat === 'All') emoji = '🌍';

            return (
              <button
                key={cat}
                onClick={() => {
                  audioSynthesizer.playChime('click');
                  setActiveSubcategory(cat);
                }}
                className="btn-cute"
                style={{
                  padding: '6px 10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--glass-bg)',
                  color: isActive ? 'white' : 'var(--text-primary)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <span>{emoji}</span>
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Stats Section */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
            <span>{activeSubcategory === 'All' ? 'Subject' : activeSubcategory} Completion</span>
            <span>{subjectDone}/{subjectTotal} Topics ({subjectPercent}%)</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${subjectPercent}%`, background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.6s ease-in-out' }} />
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-cute"
            style={{ paddingLeft: '34px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Topics Checklist List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
        {filteredTopics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '12px' }}>No matching topics found !</p>
          </div>
        ) : (
          filteredTopics.map(topic => {
            const isCompleted = topic.status === 'completed';
            const isInProgress = topic.status === 'in_progress';

            let cardBorder = '1.5px solid var(--glass-border)';
            let cardBg = 'var(--glass-bg)';
            if (isCompleted) {
              cardBorder = '1.5px solid #a7f3d0';
              cardBg = 'rgba(240, 253, 244, 0.6)';
            } else if (isInProgress) {
              cardBorder = '1.5px solid #fde047';
              cardBg = 'rgba(254, 243, 199, 0.4)';
            }

            return (
              <div
                key={topic.id}
                onClick={() => handleOpenEditor(activeSubjectTab, topic)}
                className="glass-panel"
                style={{
                  padding: '12px 14px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: cardBorder,
                  backgroundColor: cardBg,
                  cursor: 'pointer'
                }}
              >
                {/* Circle checkbox */}
                <div
                  onClick={(e) => handleToggleComplete(activeSubjectTab, topic, e)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: isCompleted ? 'none' : '2px solid var(--text-secondary)',
                    backgroundColor: isCompleted ? '#10b981' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    flexShrink: 0,
                    transition: 'var(--transition-bouncy)'
                  }}
                >
                  {isCompleted && <span style={{ fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                </div>

                {/* Main Name & Details */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    opacity: isCompleted ? 0.6 : 1,
                    lineHeight: '1.4'
                  }}>
                    {topic.name}
                  </p>

                  {/* Small Info Tags */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {topic.revisionStatus !== 'not_revised' && (
                      <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--text-primary)', fontSize: '8px', padding: '2px 6px' }}>
                        {topic.revisionStatus === 'revised_1' ? '🔄 1st Rev' :
                          topic.revisionStatus === 'revised_2' ? '🔄 2nd Rev' : '👑 Mastered'}
                      </span>
                    )}
                    {topic.targetDate && (
                      <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '8px', padding: '2px 6px' }}>
                        📅 {topic.targetDate}
                      </span>
                    )}
                    {topic.notes && (
                      <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '8px', padding: '2px 6px' }}>
                        📝 Notes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal Sheet */}
      {selectedTopic && (
        <div className="modal-backdrop" onClick={() => setSelectedTopic(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
                  Topic Workspace
                </h3>
              </div>
              <button className="btn-circle" style={{ width: '32px', height: '32px' }} onClick={() => setSelectedTopic(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="cute-subtitle" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Topic Name</span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {selectedTopic.topic.name}
                </p>
              </div>

              {/* Status & Revision Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Status Selection */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Study Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SyllabusTopic['status'])}
                    className="input-cute"
                    style={{ fontSize: '12px', padding: '8px' }}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">🔄 In Progress</option>
                    <option value="completed">💖 Completed</option>
                  </select>
                </div>

                {/* Revision Selection */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Revision level
                  </label>
                  <select
                    value={editRevision}
                    onChange={(e) => setEditRevision(e.target.value as SyllabusTopic['revisionStatus'])}
                    className="input-cute"
                    style={{ fontSize: '12px', padding: '8px' }}
                  >
                    <option value="not_revised">❌ Not Revised</option>
                    <option value="revised_1">🔄 1st Revision</option>
                    <option value="revised_2">🔄 2nd Revision</option>
                    <option value="mastered">👑 Mastered</option>
                  </select>
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Calendar size={12} /> Target Date
                </label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="input-cute"
                  style={{ fontSize: '12px', padding: '8px' }}
                />
              </div>

              {/* Study Notes */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Edit3 size={12} /> Study Notes (Formulas, Tips, etc.)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input-cute"
                  rows={4}
                  placeholder="E.g., Formula: Ratio of speeds is inversely proportional to time. Focus on geometry proofs!"
                  style={{ fontSize: '12px', resize: 'none', lineHeight: '1.4' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button className="btn-cute btn-cute-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => setSelectedTopic(null)}>
                  Cancel
                </button>
                <button className="btn-cute" style={{ flex: 1, padding: '10px' }} onClick={handleSaveEdits}>
                  <Save size={14} /> Save Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SyllabusTracker;
