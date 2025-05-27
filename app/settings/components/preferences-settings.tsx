'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Palette, Bell, MessageSquare, Shield } from 'lucide-react';

interface PreferencesSettingsProps {
  userId: string;
}

export function PreferencesSettings({ userId }: PreferencesSettingsProps) {
  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'es',
    notifications: {
      email: true,
      push: false,
      desktop: true,
    },
    chat: {
      showTyping: true,
      autoSave: true,
      autoComplete: true,
    },
    privacy: {
      shareUsage: false,
      analyticsOptIn: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Aquí iría la lógica para guardar las preferencias
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular guardado
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      toast.error('Error al guardar las preferencias');
      console.error('Error saving preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (section: string, key: string, value: any) => {
    setPreferences((prev) => {
      const sectionKey = section as keyof typeof prev;
      const currentSection = prev[sectionKey];

      if (typeof currentSection === 'object' && currentSection !== null) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [key]: value,
          },
        };
      }

      return prev;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize your experience and configure how Confidens works for you
        </p>
      </div>

      {/* Appearance */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Palette className="size-5" />
            <CardTitle className="text-lg">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme mode */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Theme Mode</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Confidens will use your selected theme across the interface
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dark Theme */}
              <div className="relative">
                <input
                  type="radio"
                  id="dark"
                  name="theme"
                  value="dark"
                  checked={preferences.theme === 'dark'}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      theme: e.target.value,
                    }))
                  }
                  className="peer sr-only"
                />
                <label
                  htmlFor="dark"
                  className="flex flex-col items-center space-y-3 rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary cursor-pointer transition-all"
                >
                  <div className="w-20 h-14 bg-slate-900 rounded-lg border overflow-hidden">
                    <div className="h-2 bg-green-500" />
                    <div className="p-3 space-y-1">
                      <div className="h-1 bg-slate-600 rounded w-10" />
                      <div className="h-1 bg-slate-600 rounded w-8" />
                      <div className="h-1 bg-slate-600 rounded w-6" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">Dark</span>
                    <p className="text-xs text-muted-foreground">Dark theme</p>
                  </div>
                </label>
              </div>

              {/* Light Theme */}
              <div className="relative">
                <input
                  type="radio"
                  id="light"
                  name="theme"
                  value="light"
                  checked={preferences.theme === 'light'}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      theme: e.target.value,
                    }))
                  }
                  className="peer sr-only"
                />
                <label
                  htmlFor="light"
                  className="flex flex-col items-center space-y-3 rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary cursor-pointer transition-all"
                >
                  <div className="w-20 h-14 bg-white rounded-lg border overflow-hidden">
                    <div className="h-2 bg-green-500" />
                    <div className="p-3 space-y-1">
                      <div className="h-1 bg-slate-300 rounded w-10" />
                      <div className="h-1 bg-slate-300 rounded w-8" />
                      <div className="h-1 bg-slate-300 rounded w-6" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">Light</span>
                    <p className="text-xs text-muted-foreground">Light theme</p>
                  </div>
                </label>
              </div>

              {/* System Theme */}
              <div className="relative">
                <input
                  type="radio"
                  id="system"
                  name="theme"
                  value="system"
                  checked={preferences.theme === 'system'}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      theme: e.target.value,
                    }))
                  }
                  className="peer sr-only"
                />
                <label
                  htmlFor="system"
                  className="flex flex-col items-center space-y-3 rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary cursor-pointer transition-all"
                >
                  <div className="w-20 h-14 bg-gradient-to-r from-slate-900 via-slate-500 to-white rounded-lg border overflow-hidden">
                    <div className="h-2 bg-green-500" />
                    <div className="p-3 space-y-1">
                      <div className="h-1 bg-slate-400 rounded w-10" />
                      <div className="h-1 bg-slate-400 rounded w-8" />
                      <div className="h-1 bg-slate-400 rounded w-6" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">System</span>
                    <p className="text-xs text-muted-foreground">
                      Match device
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred language for the interface
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="size-5" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="email-notifications"
                  className="text-base font-medium"
                >
                  Email notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important updates via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.notifications.email}
                onCheckedChange={(checked) =>
                  updatePreference('notifications', 'email', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="push-notifications"
                  className="text-base font-medium"
                >
                  Push notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Browser notifications
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences.notifications.push}
                onCheckedChange={(checked) =>
                  updatePreference('notifications', 'push', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="desktop-notifications"
                  className="text-base font-medium"
                >
                  Desktop notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  System notifications
                </p>
              </div>
              <Switch
                id="desktop-notifications"
                checked={preferences.notifications.desktop}
                onCheckedChange={(checked) =>
                  updatePreference('notifications', 'desktop', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Preferences */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="size-5" />
            <CardTitle className="text-lg">Chat Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-typing" className="text-base font-medium">
                  Typing indicator
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show when AI is typing
                </p>
              </div>
              <Switch
                id="show-typing"
                checked={preferences.chat.showTyping}
                onCheckedChange={(checked) =>
                  updatePreference('chat', 'showTyping', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-save" className="text-base font-medium">
                  Auto-save conversations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save chats
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={preferences.chat.autoSave}
                onCheckedChange={(checked) =>
                  updatePreference('chat', 'autoSave', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="auto-complete"
                  className="text-base font-medium"
                >
                  Auto-complete
                </Label>
                <p className="text-sm text-muted-foreground">
                  Suggestions while typing
                </p>
              </div>
              <Switch
                id="auto-complete"
                checked={preferences.chat.autoComplete}
                onCheckedChange={(checked) =>
                  updatePreference('chat', 'autoComplete', checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Analytics */}
      <Card className="border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Shield className="size-5" />
            <CardTitle className="text-lg">Privacy & Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Switch
                id="analytics-opt-in"
                checked={preferences.privacy.analyticsOptIn}
                onCheckedChange={(checked) =>
                  updatePreference('privacy', 'analyticsOptIn', checked)
                }
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label
                  htmlFor="analytics-opt-in"
                  className="text-sm font-medium"
                >
                  Opt-in to send telemetry data
                </Label>
                <p className="text-sm text-muted-foreground">
                  By opting into sending telemetry data, Confidens can improve
                  the overall dashboard user experience. This data is anonymized
                  and helps us understand how features are used.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-4">
              <Switch
                id="share-usage"
                checked={preferences.privacy.shareUsage}
                onCheckedChange={(checked) =>
                  updatePreference('privacy', 'shareUsage', checked)
                }
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="share-usage" className="text-sm font-medium">
                  Share usage statistics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help improve Confidens by sharing anonymous usage patterns and
                  performance metrics.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? 'Saving...' : 'Save All Preferences'}
        </Button>
      </div>
    </div>
  );
}
