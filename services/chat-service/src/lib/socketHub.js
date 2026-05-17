import { broadcastToMentoring } from '../socket/socketHandler.js';

let chatIo = null;

export function setChatIo(io) {
    chatIo = io;
}

export function getChatIo() {
    return chatIo;
}

export function broadcastQuestionEvent(mentoringId, event, payload) {
    if (!chatIo) {
        return false;
    }

    broadcastToMentoring(chatIo, mentoringId, event, payload);
    return true;
}