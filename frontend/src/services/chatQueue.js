const queueKey = 'skillcircle-offline-chat-queue';

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(queueKey) || '[]');
  } catch (_error) {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(queueKey, JSON.stringify(items));
}

export function getQueuedMessages() {
  return readQueue();
}

export function enqueueMessage(item) {
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return queue;
}

export function removeQueuedMessage(clientId) {
  const queue = readQueue().filter((item) => item.client_id !== clientId);
  writeQueue(queue);
  return queue;
}

export function clearQueuedMessages() {
  writeQueue([]);
}
