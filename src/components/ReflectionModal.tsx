// src/components/ReflectionModal.tsx
"use client";

import { useState } from "react";

type ReflectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reflection: string, tags: string[]) => void;
};

export default function ReflectionModal({ isOpen, onClose, onSave }: ReflectionModalProps) {
  const [reflection, setReflection] = useState("");
  const [tags, setTags] = useState("");

  const handleSave = () => {
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    onSave(reflection, tagList);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Reflection to CPD</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="form-group">
          <label className="form-label">Your Reflection (GMC-style)</label>
          <textarea
            className="form-control"
            rows={6}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="e.g., What did I learn? How will this change my practice?"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-control"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., gynaecology, diabetes"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} className="btn btn--primary">Save</button>
        </div>
      </div>
    </div>
  );
}