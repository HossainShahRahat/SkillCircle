import { BarChart3, Circle, Compass, MessageSquareText, Settings2, UserRound } from 'lucide-react';

export const navigation = [
  { label: 'Dashboard', path: '/', icon: Compass },
  { label: 'Profile', path: '/profile', icon: UserRound },
  { label: 'Messages', path: '/messages', icon: MessageSquareText },
  { label: 'Insights', path: '/insights', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings2 },
];

export const circleShortcutIcon = Circle;
