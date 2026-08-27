package com.codewithfriends.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/*
    message broker translates, routes and distributes messages betweeen different applications or services

-> achieves decoupling in a Publisher/Subscriber architecture so the sender (Pub) does not need to know who is recieving the message, how many, or where they are located. The receiver (Sub) tells the broker what data they are intereted in to later send to the Pub

*/

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // set up message broker for public broadcasts
        config.enableSimpleBroker("/topic");
        // incoming messages from React that hit controllers will use this prefix
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // URL handshake endpoint for React client to connect to
        registry.addEndpoint("/cwf-edit")
                .setAllowedOriginPatterns("*").withSockJS();
    }

}
