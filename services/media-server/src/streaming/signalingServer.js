import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const READY_STATE_OPEN = 1;


function send(ws, message) {
    if (ws.readyState !== READY_STATE_OPEN) {
        return;
    }

    ws.send(JSON.stringify(message));
}

// 클라이언트에게 성공 응답을 보낼 때 사용하는 헬퍼 함수, requestId와 함께 데이터 페이로드를 포함하여 전송
function sendReply(ws, requestId, data) {
    send(ws, {
        requestId,
        ok: true,
        data
    });
}

// 클라이언트에게 에러 응답을 보낼 때 사용하는 헬퍼 함수, requestId와 함께 에러 메시지를 포함하여 전송
function sendError(ws, requestId, error) {
    send(ws, {
        requestId,
        ok: false,
        error: error?.message ?? 'Unhandled signaling error'
    });
}

// WebSocket 서버를 생성하는 팩토리 함수, HTTP 서버와 미디어 오케스트레이터, 멘토링 리포지토리, 오디오 파이프라인을 주입받아 WebSocket 연결을 처리하는 서버를 반환
export function createSignalingServer({ httpServer, mediaOrchestrator, mentoringRepository, audioPipeline }) {
    const wss = new WebSocketServer({
        server: httpServer,
        path: '/ws'
    });

    const socketContext = new Map();

    // mentoringId에 해당하는 방의 모든 피어에게 특정 이벤트와 페이로드를 전송하는 헬퍼 함수, exceptPeerId가 지정된 경우 해당 피어는 제외하고 전송
    function notifyPeers(mentoringId, event, payload, exceptPeerId = null) {
        const room = mediaOrchestrator.rooms.get(Number(mentoringId));

        if (!room) {
            return;
        }

        for (const peer of room.peers.values()) {
            if (exceptPeerId && peer.peerId === exceptPeerId) {
                continue;
            }

            send(peer.socket, {
                event,
                data: payload
            });
        }
    }

    // WebSocket 연결이 수립되었을 때의 이벤트 핸들러, 클라이언트로부터 메시지를 수신하여 해당 메시지의 action에 따라 적절한 처리를 수행하고 응답을 전송함
    wss.on('connection', (ws) => {
        ws.on('message', async (rawData) => {
            let message;

            try {
                message = JSON.parse(rawData.toString());
            } catch {
                sendError(ws, undefined, new Error('Invalid JSON payload'));
                return;
            }

            const { requestId, action, data = {} } = message;

            try {
                switch (action) {
                    // joinMentoring: 클라이언트가 멘토링 세션에 참여할 때 호출되는 액션, mentoringId와 역할을 받아 해당 멘토링 세션이 LIVE 상태인지 확인한 후 미디어 오케스트레이터에 피어를 추가하고 성공 응답을 전송함
                    case 'joinMentoring': {
                        const mentoringId = Number(data.mentoringId);
                        const role = data.role ?? 'mentee';
                        const peerId = data.peerId ?? uuidv4();

                        if (!Number.isFinite(mentoringId)) {
                            throw new Error('Invalid mentoringId');
                        }

                        const mentoring = await mentoringRepository.getMentoringById(mentoringId);

                        if (!mentoring || mentoring.status !== 'LIVE') {
                            throw new Error('Mentoring session is not live');
                        }

                        const joinResult = await mediaOrchestrator.addPeer({
                            mentoringId,
                            peerId,
                            role,
                            socket: ws
                        });

                        socketContext.set(ws, { mentoringId, peerId, role });

                        sendReply(ws, requestId, {
                            peerId,
                            ...joinResult,
                            audioPipeline: audioPipeline.getRoomSnapshot(mentoringId)
                        });

                        notifyPeers(
                            mentoringId,
                            'peer-joined',
                            {
                                peerId,
                                role
                            },
                            peerId
                        );
                        break;
                    }
                    // createWebRtcTransport: 클라이언트가 WebRTC 트랜스포트를 생성할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 트랜스포트 생성을 요청하고 결과를 응답으로 전송함
                    case 'createWebRtcTransport': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        const transport = await mediaOrchestrator.createWebRtcTransport({
                            mentoringId: context.mentoringId,
                            peerId: context.peerId,
                            direction: data.direction ?? 'recv'
                        });

                        sendReply(ws, requestId, transport);
                        break;
                    }
                    // connectWebRtcTransport: 클라이언트가 WebRTC 트랜스포트를 연결할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 트랜스포트 연결을 요청하고 성공 여부를 응답으로 전송함
                    case 'connectWebRtcTransport': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        await mediaOrchestrator.connectTransport({
                            mentoringId: context.mentoringId,
                            peerId: context.peerId,
                            transportId: data.transportId,
                            dtlsParameters: data.dtlsParameters
                        });

                        sendReply(ws, requestId, { connected: true });
                        break;
                    }
                    // produce: 클라이언트가 미디어를 생산할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 프로듀싱을 요청하고 결과로 생성된 프로듀서 정보를 응답으로 전송함, 또한 같은 방의 다른 피어들에게 새로운 프로듀서가 생성되었음을 알리는 이벤트를 전송함
                    case 'produce': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        const produced = await mediaOrchestrator.produce({
                            mentoringId: context.mentoringId,
                            peerId: context.peerId,
                            transportId: data.transportId,
                            kind: data.kind,
                            rtpParameters: data.rtpParameters,
                            appData: data.appData
                        });

                        sendReply(ws, requestId, produced);

                        notifyPeers(
                            context.mentoringId,
                            'new-producer',
                            {
                                producerId: produced.producerId,
                                peerId: context.peerId,
                                kind: data.kind,
                                role: context.role
                            },
                            context.peerId
                        );
                        break;
                    }
                    // consume: 클라이언트가 미디어를 소비할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 소비를 요청하고 결과로 생성된 소비자 정보를 응답으로 전송함
                    case 'consume': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        const consumed = await mediaOrchestrator.consume({
                            mentoringId: context.mentoringId,
                            peerId: context.peerId,
                            transportId: data.transportId,
                            producerId: data.producerId,
                            rtpCapabilities: data.rtpCapabilities
                        });

                        sendReply(ws, requestId, consumed);
                        break;
                    }
                    // pauseConsumer: 클라이언트가 소비자를 일시정지할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 소비자 일시정지를 요청하고 성공 여부를 응답으로 전송함
                    case 'resumeConsumer': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        await mediaOrchestrator.resumeConsumer({
                            mentoringId: context.mentoringId,
                            peerId: context.peerId,
                            consumerId: data.consumerId
                        });

                        sendReply(ws, requestId, { resumed: true });
                        break;
                    }
                    // listProducers: 클라이언트가 현재 방에서 사용할 수 있는 프로듀서 목록을 조회할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 해당 피어가 소비할 수 있는 프로듀서 ID 목록을 요청하고 응답으로 전송함
                    case 'listProducers': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        const producerIds = mediaOrchestrator.getProducerIdsForPeer(
                            context.mentoringId,
                            context.peerId
                        );

                        sendReply(ws, requestId, producerIds);
                        break;
                    }
                    // ttsEnqueue: 클라이언트가 TTS 메시지를 큐에 추가할 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 오디오 파이프라인에 TTS 메시지 추가를 요청하고 성공 여부를 응답으로 전송함
                    case 'ttsEnqueue': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            throw new Error('joinMentoring first');
                        }

                        audioPipeline.enqueueTtsMessage(context.mentoringId, {
                            peerId: context.peerId,
                            text: data.text,
                            metadata: data.metadata ?? null
                        });

                        sendReply(ws, requestId, {
                            queued: true,
                            message: 'TTS request queued; attach a tts-bot audio producer to inject actual synthesized audio'
                        });
                        break;
                    }
                    // leaveMentoring: 클라이언트가 멘토링 세션에서 나갈 때 호출되는 액션, mentoringId와 peerId를 컨텍스트에서 조회하여 미디어 오케스트레이터에 피어 제거를 요청하고 같은 방의 다른 피어들에게 해당 피어가 나갔음을 알리는 이벤트를 전송한 후 성공 응답을 전송함
                    case 'leaveMentoring': {
                        const context = socketContext.get(ws);

                        if (!context) {
                            sendReply(ws, requestId, { left: true });
                            break;
                        }

                        mediaOrchestrator.removePeer({
                            mentoringId: context.mentoringId,
                            peerId: context.peerId
                        });

                        notifyPeers(
                            context.mentoringId,
                            'peer-left',
                            { peerId: context.peerId },
                            context.peerId
                        );

                        socketContext.delete(ws);
                        sendReply(ws, requestId, { left: true });
                        break;
                    }
                    default:
                        throw new Error(`Unknown signaling action: ${action}`);
                }
            } catch (error) {
                sendError(ws, requestId, error);
            }
        });

        // WebSocket 연결이 종료되었을 때의 이벤트 핸들러, 컨텍스트에서 mentoringId와 peerId를 조회하여 미디어 오케스트레이터에 피어 제거를 요청하고 같은 방의 다른 피어들에게 해당 피어가 나갔음을 알리는 이벤트를 전송함, 마지막으로 컨텍스트에서 해당 소켓을 삭제함
        ws.on('close', () => {
            const context = socketContext.get(ws);

            if (!context) {
                return;
            }

            mediaOrchestrator.removePeer({
                mentoringId: context.mentoringId,
                peerId: context.peerId
            });

            notifyPeers(
                context.mentoringId,
                'peer-left',
                { peerId: context.peerId },
                context.peerId
            );

            socketContext.delete(ws);
        });
    });

    return wss;
}
