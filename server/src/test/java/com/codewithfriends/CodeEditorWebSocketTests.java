package com.codewithfriends;

import com.codewithfriends.dto.TextOp;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CodeEditorWebSocketTests {

    @LocalServerPort
    private int port;

    @Test
    void mirrorsInsertOpBetweenTwoClients() throws Exception {
        WebSocketStompClient stompClient = new WebSocketStompClient(
            new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient())))
        );
        stompClient.setMessageConverter(new JacksonJsonMessageConverter());

        String url = "http://localhost:" + port + "/cwf-edit";
        BlockingQueue<TextOp> received = new LinkedBlockingQueue<>();

        StompSession sessionA = connect(stompClient, url, received);
        StompSession sessionB = connect(stompClient, url, received);
        Thread.sleep(400);

        TextOp outgoing = TextOp.insert("html", 5, "!", "client-a");
        sessionA.send("/app/update-code", outgoing);

        TextOp first = received.poll(3, TimeUnit.SECONDS);
        assertNotNull(first, "expected a mirrored insert op");
        assertEquals("insert", first.getKind());
        assertEquals("html", first.getType());
        assertEquals(5, first.getIndex());
        assertEquals("!", first.getText());
        assertEquals("client-a", first.getSenderId());

        sessionA.disconnect();
        sessionB.disconnect();
    }

    private StompSession connect(
        WebSocketStompClient stompClient,
        String url,
        BlockingQueue<TextOp> received
    ) throws Exception {
        return stompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                session.subscribe("/topic/workspace", new StompFrameHandler() {
                    @Override
                    public Type getPayloadType(StompHeaders headers) {
                        return TextOp.class;
                    }

                    @Override
                    public void handleFrame(StompHeaders headers, Object payload) {
                        if (payload instanceof TextOp textOp) {
                            received.offer(textOp);
                        }
                    }
                });
            }
        }).get(5, TimeUnit.SECONDS);
    }
}
