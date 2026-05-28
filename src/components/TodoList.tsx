import React, { useState } from 'react';
import { Plus, Trash2, Calendar, ClipboardCheck, Sparkles } from 'lucide-react';
import type { TodoItem, TodoCategory, PriorityLevel } from '../types';
import { audioSynthesizer } from './AudioSynthesizer';

interface TodoListProps {
  todos: TodoItem[];
  onAddTodo: (text: string, category: TodoCategory, priority: PriorityLevel, dueDate?: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo
}) => {
  const [activeCategory, setActiveCategory] = useState<TodoCategory>('study');
  const [taskText, setTaskText] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('medium');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    audioSynthesizer.playChime('complete');
    onAddTodo(taskText, activeCategory, taskPriority, taskDueDate || undefined);

    // Reset Form
    setTaskText('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setShowAddForm(false);
  };

  const handleToggle = (id: string, isCompletedBefore: boolean) => {
    if (!isCompletedBefore) {
      audioSynthesizer.playChime('complete');
    } else {
      audioSynthesizer.playChime('click');
    }
    onToggleTodo(id);
  };

  const handleDelete = (id: string) => {
    audioSynthesizer.playChime('click');
    onDeleteTodo(id);
  };

  // Get current active todos
  const categoryTodos = todos.filter(todo => todo.category === activeCategory);

  // Stats
  const totalInCat = categoryTodos.length;
  const doneInCat = categoryTodos.filter(t => t.completed).length;
  const percentInCat = totalInCat > 0 ? Math.round((doneInCat / totalInCat) * 100) : 0;

  // Category Icon helper
  const getCatIcon = (cat: TodoCategory) => {
    switch (cat) {
      case 'study': return '📚';
      case 'personal': return '🌸';
      case 'health': return '🏃‍♀️';
      case 'misc': return '⭐';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Category selector grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
        {(['study', 'personal', 'health', 'misc'] as TodoCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => { audioSynthesizer.playChime('click'); setActiveCategory(cat); }}
            className="tab-item"
            style={{
              padding: '10px 4px',
              borderRadius: '16px',
              backgroundColor: activeCategory === cat ? 'var(--accent-light)' : 'var(--glass-bg)',
              border: activeCategory === cat ? '1.5px solid var(--accent)' : '1.5px solid var(--glass-border)',
              color: activeCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: activeCategory === cat ? 'var(--panel-shadow)' : 'none',
              transform: activeCategory === cat ? 'scale(1.03)' : 'none'
            }}
          >
            <span style={{ fontSize: '18px', marginBottom: '2px' }}>{getCatIcon(cat)}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'capitalize', fontFamily: 'var(--font-cute)' }}>
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Progress & Add Toggle */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="cute-subtitle" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
            Category Progress
          </span>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {doneInCat} of {totalInCat} tasks ({percentInCat}%)
          </p>
        </div>

        <button
          className="btn-cute"
          onClick={() => { audioSynthesizer.playChime('click'); setShowAddForm(!showAddForm); }}
          style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '12px' }}
        >
          <Plus size={12} /> {showAddForm ? 'Close' : 'Add Task'}
        </button>
      </div>

      {/* Add Task Form Panel */}
      {showAddForm && (
        <form className="glass-panel" onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
            ✨ Create Category Task
          </h4>

          <div>
            <input
              type="text"
              placeholder="What needs to be done"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="input-cute"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Priority Level
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as PriorityLevel)}
                className="input-cute"
                style={{ padding: '8px', fontSize: '11px' }}
              >
                <option value="high">🔥 High Priority</option>
                <option value="medium">⚡ Medium Priority</option>
                <option value="low">🍃 Low Priority</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="input-cute"
                style={{ padding: '7px', fontSize: '11px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-cute" style={{ width: '100%', padding: '10px' }}>
            Save Task 🌸
          </button>
        </form>
      )}

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
        {categoryTodos.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
            <ClipboardCheck size={28} style={{ color: 'var(--accent)', opacity: 0.6, marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', fontWeight: 500 }}>No tasks in this category!</p>
            <p style={{ fontSize: '10px', opacity: 0.8 }}>Add a task above to keep organized.</p>
          </div>
        ) : (
          categoryTodos.map(todo => {
            const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

            return (
              <div
                key={todo.id}
                className="glass-panel"
                style={{
                  padding: '12px 14px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: todo.completed ? '1.5px solid var(--glass-border)' : '1.5px solid rgba(255,255,255,0.7)',
                  backgroundColor: todo.completed ? 'rgba(255,255,255,0.4)' : 'var(--glass-bg)',
                  opacity: todo.completed ? 0.75 : 1
                }}
              >
                {/* Complete checkbox bubble */}
                <div
                  onClick={() => handleToggle(todo.id, todo.completed)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: todo.completed ? 'none' : '2px solid var(--text-secondary)',
                    backgroundColor: todo.completed ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    flexShrink: 0
                  }}
                >
                  {todo.completed && <span style={{ fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                </div>

                {/* Text & due dates */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    opacity: todo.completed ? 0.6 : 1,
                    lineHeight: '1.4'
                  }}>
                    {todo.text}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge badge-${todo.priority}`} style={{ fontSize: '8px', padding: '1px 5px', textTransform: 'capitalize' }}>
                      {todo.priority === 'high' ? '🔥 High' : todo.priority === 'medium' ? '⚡ Med' : '🍃 Low'}
                    </span>

                    {todo.dueDate && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isOverdue ? '#fee2e2' : '#f0f9ff',
                          color: isOverdue ? '#ef4444' : '#0284c7',
                          fontSize: '8px',
                          padding: '1px 5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Calendar size={8} /> {todo.dueDate} {isOverdue && '⚠️'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete trash button */}
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="btn-circle"
                  style={{ width: '28px', height: '28px', color: '#ef4444', borderColor: 'transparent', background: 'transparent' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Summary Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 14px',
          background: 'linear-gradient(135deg, var(--accent-light), rgba(255,255,255,0.4))',
          border: '1px dashed var(--accent)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Sparkles size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '10.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
          You have {todos.filter(t => !t.completed).length} total tasks pending. You are doing amazing! 🌸
        </span>
      </div>
    </div>
  );
};
export default TodoList;
