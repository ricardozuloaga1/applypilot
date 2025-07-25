"use client"

import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { CheckCircle, Sparkles, User, FileText } from "lucide-react";

interface EnhancementPopoverProps {
  enhancement: any;
  onSave: (enhancement: any, familiarity: string, experience: string) => void;
  children: React.ReactNode;
}

export const EnhancementPopover: React.FC<EnhancementPopoverProps> = ({ enhancement, onSave, children }) => {
  const [familiarity, setFamiliarity] = useState('');
  const [experience, setExperience] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (!familiarity) {
      alert('Please select your familiarity level');
      return;
    }
    if (!experience.trim()) {
      alert('Please describe your experience');
      return;
    }
    onSave(enhancement, familiarity, experience);
    setIsOpen(false);
    // Reset form
    setFamiliarity('');
    setExperience('');
  };

  const getFamiliarityColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-orange-600 bg-orange-100';
      case 'intermediate': return 'text-blue-600 bg-blue-100';
      case 'expert': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFamiliarityIcon = (level: string) => {
    switch (level) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🔧';
      case 'expert': return '🏆';
      default: return '❓';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-lg border-0" side="top" align="start" sideOffset={8} alignOffset={0}>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Enhancement Details</h4>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {enhancement.category}
                  </Badge>
                </div>
                <p className="font-medium text-gray-900 mb-1">
                  {enhancement.requirement}
                </p>
                <p className="text-sm text-gray-600 italic">
                  {enhancement.gapAction}
                </p>
              </div>
            </div>

            {/* Familiarity Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <label className="font-medium text-gray-900">Rate Your Familiarity</label>
              </div>
              <Select onValueChange={setFamiliarity} value={familiarity}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <span>🌱</span>
                      <span>Beginner - Basic knowledge</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <span>🔧</span>
                      <span>Intermediate - Practical experience</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expert">
                    <div className="flex items-center gap-2">
                      <span>🏆</span>
                      <span>Expert - Advanced proficiency</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <label className="font-medium text-gray-900">Describe Your Experience</label>
              </div>
              <Textarea 
                className="bg-white min-h-[100px] resize-none"
                placeholder="Example: I have 2 years of experience using this technology in production environments. I've worked on projects involving..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                💡 Tip: Be specific about projects, tools, duration, and achievements
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!familiarity || !experience.trim()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Enhancement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="bg-white"
              >
                Cancel
              </Button>
            </div>

            {/* Preview */}
            {familiarity && experience && (
              <div className="bg-white p-3 rounded-lg border border-green-200 bg-green-50/50">
                <p className="text-xs text-green-700 font-medium mb-2">Preview:</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{getFamiliarityIcon(familiarity)}</span>
                  <Badge className={`text-xs ${getFamiliarityColor(familiarity)}`}>
                    {familiarity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-700 line-clamp-2">
                  {experience}
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};