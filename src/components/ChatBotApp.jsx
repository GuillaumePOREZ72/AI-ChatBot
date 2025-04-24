

import "./ChatBotApp.css";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";


const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const ChatBotApp = ({
  onGoBack,
  chats,
  setChats,
  activeChat,
  setActiveChat,
  onNewChat,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(chats[0]?.messages || []);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const activeChatObj = chats.find((chat) => chat.id === activeChat);
    setMessages(activeChatObj ? activeChatObj.messages : []);
  }, [activeChat, chats]);

  useEffect(() => {
    if (activeChat) {
      const storedMessages = JSON.parse(localStorage.getItem(activeChat)) || [];
      setMessages(storedMessages);
    }
  }, [activeChat]);

  const handleEmojiSelect = (emoji) => {
    setInputValue((prevInput) => prevInput + emoji.native);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const sendMessage = async () => {
    if (inputValue.trim === "") return;

    const newMessage = {
      type: "prompt",
      text: inputValue,
      timeStamp: new Date().toLocaleTimeString(),
    };

    if (!activeChat) {
      onNewChat(inputValue);
      setInputValue("");
    } else {
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem(activeChat, JSON.stringify(updatedMessages));
      setInputValue("");

      const updatedChats = chats.map((chat) => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: updatedMessages,
          };
        }
        return chat;
      });
      setChats(updatedChats);
      localStorage.setItem("chats", JSON.stringify(updatedChats));
      setIsTyping(true);

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GOOGLE_AI_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gemini-2.0-flash-exp",
            messages: [{ role: "user", content: inputValue }],
            max_tokens: 2000,
          }),
        }
      );

      const data = await response.json();

      // Check if data and necessary properties exist before accessing them
      if (
        data &&
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        const chatResponse = data.choices[0].message.content.trim();

        const newResponse = {
          type: "response",
          text: chatResponse,
          timeStamp: new Date().toLocaleTimeString(),
        };
        const updatedMessagesWithResponse = [...updatedMessages, newResponse];
        setMessages(updatedMessagesWithResponse);
        localStorage.setItem(
          activeChat,
          JSON.stringify(updatedMessagesWithResponse)
        );
        setIsTyping(false);

        const updatedChatsWithResponse = chats.map((chat) => {
          if (chat.id === activeChat) {
            return { ...chat, messages: updatedMessagesWithResponse };
          }
          return chat;
        });
        setChats(updatedChatsWithResponse);
      } else {
        // Handle the error gracefully
        console.error("Invalid API response:", data);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSelectChat = (id) => {
    setActiveChat(id);
  };

  const handleDeleteChat = (id) => {
    const updatedChats = chats.filter((chat) => chat.id !== id);
    setChats(updatedChats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    localStorage.removeItem(id);

    if (id === activeChat) {
      const newActiveChat = updatedChats.length > 0 ? updatedChats[0].id : null;
      setActiveChat(newActiveChat);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-app">
      <div className={`chat-list ${showChatList ? "show" : ""}`}>
        <div className="chat-list-header">
          <h2>Chat List</h2>
          <i className="bx bx-edit-alt new-chat" onClick={onNewChat}></i>
          <i
            className="bx bx-x-circle close-list"
            onClick={() => setShowChatList(false)}
          ></i>
        </div>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-list-item ${chat.id === activeChat ? "active" : ""}`}
            onClick={() => handleSelectChat(chat.id)}
          >
            <h4>{chat.displayId}</h4>
            <i
              className="bx bx-x-circle"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteChat(chat.id);
              }}
            ></i>
          </div>
        ))}
      </div>
      <div className="chat-window">
        <div className="chat-title">
          <h3>Chat With AI</h3>
          <i className="bx bx-menu" onClick={() => setShowChatList(true)}></i>

          <i className="bx bx-arrow-back arrow" onClick={onGoBack}></i>
        </div>
        <div className="chat">
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.type === "prompt" ? "prompt" : "response"}
            >
              {message.text}
              <span>{message.timeStamp}</span>
            </div>
          ))}

          {isTyping && <div className="typing">Typing...</div>}
          <div ref={chatEndRef}></div>
        </div>
        <form className="msg-form" onSubmit={(e) => e.preventDefault()}>
          <i
            className="fa-solid fa-face-smile emoji"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          ></i>
          {showEmojiPicker && (
            <div className="picker">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
          <input
            type="text"
            className="msg-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowEmojiPicker(false)}
          />
          <i className="fa-solid fa-paper-plane" onClick={sendMessage}></i>
        </form>
      </div>
    </div>
  );
};
ChatBotApp.propTypes = {
  onGoBack: PropTypes.func.isRequired,
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      displayId: PropTypes.string.isRequired,
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          text: PropTypes.string.isRequired,
          timeStamp: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  setChats: PropTypes.func.isRequired,
  activeChat: PropTypes.string,
  setActiveChat: PropTypes.func.isRequired,
  onNewChat: PropTypes.func.isRequired,
};

export default ChatBotApp;

