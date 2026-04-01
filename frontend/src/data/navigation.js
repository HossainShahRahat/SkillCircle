import { BarChart3, Bell, Circle, Compass, MessageSquareText, Settings2, Users, UserRound } from 'lucide-react';

export const navigation = [
  { label: 'Home', path: '/', icon: Compass },
  { label: 'Circles', path: '/circles', icon: Users },
  { label: 'Inbox', path: '/messages', icon: MessageSquareText },
  { label: 'Alerts', path: '/notifications', icon: Bell },
  { label: 'Profile', path: '/profile', icon: UserRound },
  { label: 'Insights', path: '/insights', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings2 },
];

export const circleShortcutIcon = Circle;
