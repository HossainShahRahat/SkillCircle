import { Card } from './Card.jsx';
import { ChatThread } from './ChatThread.jsx';

export function CircleChatPanel(props) {
  return (
    <Card className="flex h-[640px] flex-col overflow-hidden p-0">
      <ChatThread
        title="Circle chat"
        subtitle="Live messages, shared files, reactions, and delivery states for the whole group."
        emptyMessage="No messages yet. Start the conversation with a quick update, file, or question."
        {...props}
      />
    </Card>
  );
}
