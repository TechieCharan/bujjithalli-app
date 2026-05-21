import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Camera, Heart, Check, Sparkles, FolderPlus } from 'lucide-react';
import type { BucketItem } from '../types';
import { photoStorage } from '../db/storage';
import { audioSynthesizer } from './AudioSynthesizer';

interface BucketListProps {
  bucketList: BucketItem[];
  onAddBucketItem: (title: string, description: string, category: string, imageKey?: string, targetDate?: string) => void;
  onToggleBucketItem: (id: string) => void;
  onDeleteBucketItem: (id: string, imageKey?: string) => void;
}

export const BucketList: React.FC<BucketListProps> = ({
  bucketList,
  onAddBucketItem,
  onToggleBucketItem,
  onDeleteBucketItem
}) => {
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>(['Travel ✈️', 'Career 💼', 'Fitness 🏃‍♀️', 'Experiences 🎡', 'Purchases 🛍️', 'Personal Growth 🌱']);
  
  // New Dream States
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Travel ✈️');
  const [targetDate, setTargetDate] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Custom Category Add State
  const [showCustomCat, setShowCustomCat] = useState<boolean>(false);
  const [customCatName, setCustomCatName] = useState<string>('');

  // Loaded Photos State (mapping of id/key to base64 string)
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, string>>({});

  // Load photos from IndexedDB on component mount & when bucket list changes
  useEffect(() => {
    const loadAllPhotos = async () => {
      const photos: Record<string, string> = {};
      for (const item of bucketList) {
        if (item.imageUrl) {
          const data = await photoStorage.get(item.imageUrl);
          if (data) {
            photos[item.imageUrl] = data;
          }
        }
      }
      setLoadedPhotos(photos);
    };
    loadAllPhotos();
  }, [bucketList]);

  // Handle Photo File Selector
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress & convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Add custom category
  const handleAddCategory = () => {
    if (!customCatName.trim()) return;
    audioSynthesizer.playChime('complete');
    setCategories([...categories, customCatName.trim()]);
    setCategory(customCatName.trim());
    setCustomCatName('');
    setShowCustomCat(false);
  };

  // Add Item Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let imageKey: string | undefined = undefined;

    // Save image to IndexedDB if present
    if (imagePreview) {
      imageKey = `photo_${Date.now()}`;
      await photoStorage.save(imageKey, imagePreview);
    }

    audioSynthesizer.playChime('complete');
    onAddBucketItem(title, description, category, imageKey, targetDate || undefined);

    // Reset Form
    setTitle('');
    setDescription('');
    setTargetDate('');
    setImagePreview(null);
    setShowAddForm(false);
  };

  const handleToggle = (id: string, isCompletedBefore: boolean) => {
    if (!isCompletedBefore) {
      audioSynthesizer.playChime('complete');
    } else {
      audioSynthesizer.playChime('click');
    }
    onToggleBucketItem(id);
  };

  const handleDelete = async (id: string, imgKey?: string) => {
    audioSynthesizer.playChime('click');
    if (imgKey) {
      await photoStorage.delete(imgKey);
    }
    onDeleteBucketItem(id, imgKey);
  };

  // Filter Items
  const filteredItems = activeFilterCategory === 'all'
    ? bucketList
    : bucketList.filter(item => item.category === activeFilterCategory);

  // Stats
  const totalDreams = bucketList.length;
  const doneDreams = bucketList.filter(t => t.completed).length;
  const percentDreams = totalDreams > 0 ? Math.round((doneDreams / totalDreams) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Dynamic Progress Bar */}
      <div className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center', background: 'linear-gradient(135deg, var(--glass-bg), var(--accent-light))' }}>
        <span className="badge" style={{ backgroundColor: 'var(--accent)', color: 'white', marginBottom: '6px' }}>
          Dream Catcher ✨
        </span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
          {doneDreams} of {totalDreams} Dreams Achieved ({percentDreams}%)
        </h3>
        
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
          <div style={{ height: '100%', width: `${percentDreams}%`, background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.6s ease-in-out' }} />
        </div>
      </div>

      {/* Categories Horizontal scrolling filter */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', margin: '0 -4px' }}>
        <button
          onClick={() => { audioSynthesizer.playChime('click'); setActiveFilterCategory('all'); }}
          className="btn-cute btn-cute-secondary"
          style={{
            padding: '6px 10px', fontSize: '11px', flexShrink: 0, borderRadius: '12px',
            backgroundColor: activeFilterCategory === 'all' ? 'var(--accent)' : 'var(--glass-bg)',
            color: activeFilterCategory === 'all' ? 'white' : 'var(--text-primary)',
            borderColor: 'var(--glass-border)'
          }}
        >
          🌈 All Dreams
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { audioSynthesizer.playChime('click'); setActiveFilterCategory(cat); }}
            className="btn-cute btn-cute-secondary"
            style={{
              padding: '6px 10px', fontSize: '11px', flexShrink: 0, borderRadius: '12px',
              backgroundColor: activeFilterCategory === cat ? 'var(--accent)' : 'var(--glass-bg)',
              color: activeFilterCategory === cat ? 'white' : 'var(--text-primary)',
              borderColor: 'var(--glass-border)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add New Dream Trigger */}
      <button 
        className="btn-cute" 
        onClick={() => { audioSynthesizer.playChime('click'); setShowAddForm(!showAddForm); }}
        style={{ padding: '10px', borderRadius: '14px', width: '100%', fontSize: '12px' }}
      >
        <Plus size={14} /> Add a New Dream Goal 🌸
      </button>

      {/* Add Dream Form Sheet */}
      {showAddForm && (
        <form className="glass-panel" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-cute)' }}>
            💖 Capture Your Dream Goal
          </h4>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              What is your Dream Goal?
            </label>
            <input
              type="text"
              placeholder="e.g. Visit cherry blossom gardens in Japan 🌸"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-cute"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Select Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-cute"
                style={{ padding: '8px', fontSize: '11px' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              type="button"
              className="btn-cute btn-cute-secondary"
              onClick={() => { audioSynthesizer.playChime('click'); setShowCustomCat(!showCustomCat); }}
              style={{ padding: '8px', fontSize: '10px', borderRadius: '12px', width: '100%', display: 'flex', gap: '2px' }}
            >
              <FolderPlus size={10} /> Custom Cat
            </button>
          </div>

          {/* Inline Custom Category Add Form */}
          {showCustomCat && (
            <div style={{ display: 'flex', gap: '6px', background: 'var(--accent-light)', padding: '10px', borderRadius: '12px', border: '1px dashed var(--accent)' }}>
              <input
                type="text"
                placeholder="e.g. Travel ✈️, Creative 🎨"
                value={customCatName}
                onChange={(e) => setCustomCatName(e.target.value)}
                className="input-cute"
                style={{ padding: '6px', fontSize: '11px', flex: 1 }}
              />
              <button type="button" className="btn-cute" onClick={handleAddCategory} style={{ padding: '6px 10px', fontSize: '10px' }}>
                Add
              </button>
            </div>
          )}

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-cute"
              style={{ padding: '7px', fontSize: '11px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Goal Notes & Description
            </label>
            <textarea
              placeholder="Why is this dream important to you? What will you do when you achieve it?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-cute"
              rows={3}
              style={{ fontSize: '11px', resize: 'none', lineHeight: '1.4' }}
            />
          </div>

          {/* Photo File Selector */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Upload Dream Photo
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label 
                style={{
                  width: '50px', height: '50px', borderRadius: '12px', border: '1.5px dashed var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: 'var(--accent)', background: 'var(--glass-bg)', overflow: 'hidden'
                }}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }} 
                />
                {imagePreview ? (
                  <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={18} />
                )}
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {imagePreview ? '✓ Photo selected!' : 'Choose a beautiful image file...'}
              </span>
            </div>
          </div>

          <button type="submit" className="btn-cute" style={{ width: '100%', padding: '10px' }}>
            Save Dream 🌸
          </button>
        </form>
      )}

      {/* Staggered Pinterest-style Cards Grid Layout */}
      <div className="pinterest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
            <Sparkles size={28} style={{ color: 'var(--accent)', opacity: 0.6, marginBottom: '8px', display: 'inline-block' }} />
            <p style={{ fontSize: '12px', fontWeight: 500 }}>No dreams added yet in this category!</p>
            <p style={{ fontSize: '10px', opacity: 0.8 }}>Add some big dreams above!</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const hasImage = !!item.imageUrl && !!loadedPhotos[item.imageUrl];
            const imgData = item.imageUrl ? loadedPhotos[item.imageUrl] : null;

            return (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: 0,
                  margin: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  border: item.completed ? '1.5px solid #a7f3d0' : '1.5px solid var(--glass-border)',
                  backgroundColor: 'var(--glass-bg)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {/* Dream image cover or soft pastel default backdrop */}
                {hasImage && imgData ? (
                  <div style={{ width: '100%', height: '110px', position: 'relative' }}>
                    <img src={imgData} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4))' }} />
                  </div>
                ) : (
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '80px', 
                      background: 'linear-gradient(135deg, var(--accent-light), var(--bg-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-cute)',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    ✨ {item.category}
                  </div>
                )}

                {/* Floating Hearts Complete checkbadge */}
                <div
                  onClick={() => handleToggle(item.id, item.completed)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: item.completed ? '#10b981' : 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: item.completed ? 'white' : 'var(--text-primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 5,
                    transition: 'var(--transition-bouncy)'
                  }}
                >
                  {item.completed ? <Check size={14} /> : <Heart size={12} />}
                </div>

                {/* Description details body */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  {/* Category text badge */}
                  <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.category}
                  </span>

                  <h5 style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: '1.3',
                    textDecoration: item.completed ? 'line-through' : 'none',
                    opacity: item.completed ? 0.6 : 1
                  }}>
                    {item.title}
                  </h5>

                  {item.description && (
                    <p style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </p>
                  )}

                  {item.targetDate && (
                    <span style={{ fontSize: '8px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
                      📅 Target: {item.targetDate}
                    </span>
                  )}

                  {/* Actions (trash) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      onClick={() => handleDelete(item.id, item.imageUrl)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default BucketList;
