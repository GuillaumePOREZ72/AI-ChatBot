import "./ChatBotApp.css";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useUser, SignOutButton } from "@clerk/clerk-react";
import { getUserData, setUserData, removeUserData } from "../utils/userStorage";
import ThemeToggle from "./ThemeToggle";

const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const ChatBotApp = ({
  onGoBack,
  chats,
  setChats,
  activeChat,
  setActiveChat,
  onNewChat,
}) => {
  const { user } = useUser();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(chats[0]?.messages || []);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const activeChatObj = chats.find((chat) => chat.id === activeChat);
    setMessages(activeChatObj ? activeChatObj.messages : []);
  }, [activeChat, chats]);

  useEffect(() => {
    if (activeChat && user) {
      const storedMessages = getUserData(user.id, `chat_${activeChat}`, []);
      setMessages(storedMessages);
    }
  }, [activeChat, user]);

  const handleEmojiSelect = (emoji) => {
    setInputValue((prevInput) => prevInput + emoji.native);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const sendMessage = async () => {
    if (inputValue.trim() === "") return;

    // Sauvegarder le message utilisateur pour éviter de le perdre
    const userMessageText = inputValue.trim();

    const newMessage = {
      type: "prompt",
      text: userMessageText,
      timeStamp: new Date().toLocaleTimeString(),
    };

    try {
      if (!activeChat) {
        onNewChat(userMessageText);
        setInputValue("");
        return;
      }

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setUserData(user.id, `chat_${activeChat}`, updatedMessages);
      setInputValue("");
      setIsTyping(true);

      console.log("🚀 Envoi du message à Gemini:", userMessageText);
      console.log("🔑 Clé API:", GOOGLE_AI_KEY ? "Présente" : "Manquante");

      // NOUVELLE URL DIRECTE avec le bon nom de modèle
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`;

      console.log("🌐 URL API:", apiUrl);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: userMessageText,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      console.log(
        "📦 Corps de la requête:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "📡 Statut de la réponse:",
        response.status,
        response.statusText
      );

      const data = await response.json();
      console.log("📥 Données reçues:", data);

      if (!response.ok) {
        const errorMessage =
          data.error?.message ||
          `Erreur API: ${response.status} ${response.statusText}`;
        console.error("❌ Erreur API:", errorMessage);
        throw new Error(errorMessage);
      }

      // Vérifier la structure de la réponse
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];

        if (
          candidate.content &&
          candidate.content.parts &&
          candidate.content.parts.length > 0
        ) {
          const chatResponse = candidate.content.parts[0].text.trim();
          console.log("✅ Réponse de Gemini:", chatResponse);

          const newResponse = {
            type: "response",
            text: chatResponse,
            timeStamp: new Date().toLocaleTimeString(),
          };

          const updatedMessagesWithResponse = [...updatedMessages, newResponse];
          setMessages(updatedMessagesWithResponse);
          setUserData(
            user.id,
            `chat_${activeChat}`,
            updatedMessagesWithResponse
          );
        } else {
          throw new Error(
            "Structure de réponse inattendue: pas de contenu dans les parts"
          );
        }
      } else {
        throw new Error("Structure de réponse inattendue: pas de candidats");
      }
    } catch (error) {
      console.error("💥 Erreur complète:", error);

      // Afficher l'erreur à l'utilisateur
      const errorResponse = {
        type: "response",
        text: `❌ Erreur: ${error.message}\n\nVérifiez la console pour plus de détails.`,
        timeStamp: new Date().toLocaleTimeString(),
      };

      const updatedMessagesWithError = [...messages, newMessage, errorResponse];
      setMessages(updatedMessagesWithError);
      setUserData(user.id, `chat_${activeChat}`, updatedMessagesWithError);
    } finally {
      setIsTyping(false);
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
    if (!user) return; // Sécurité

    const updatedChats = chats.filter((chat) => chat.id !== id);
    setChats(updatedChats);

    // Sauvegarder avec le système utilisateur
    setUserData(user.id, "chats", updatedChats);
    removeUserData(user.id, `chat_${id}`);

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
      <div
        className={`chat-list ${showChatList ? "show" : ""} ${
          !isSidebarVisible ? "hidden" : ""
        }`}
      >
        <div className="chat-list-header">
          <h2>Chat List</h2>
          <i className="bx bx-edit-alt new-chat" onClick={onNewChat}></i>
          <i
            className="bx bx-x-circle close-list"
            onClick={() => {
              setShowChatList(false);
              setIsSidebarVisible(false);
            }}
            title="Fermer la sidebar"
          ></i>
        </div>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-list-item ${
              chat.id === activeChat ? "active" : ""
            }`}
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
          <div className="chat-title-left">
            <h3>Chat With AI</h3>
            <div className="user-profile">
              <div className="user-avatar">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Avatar"
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {(
                      user?.firstName?.[0] ||
                      user?.emailAddresses[0]?.emailAddress[0] ||
                      "?"
                    ).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.firstName || user?.username || "Utilisateur"}
                </span>
                <span className="user-status">En ligne</span>
              </div>
            </div>
          </div>
          <div className="chat-title-right">
            <i
              className="bx bx-menu"
              onClick={() => {
                setShowChatList(true);
                setIsSidebarVisible(true);
              }}
              title="Ouvrir la sidebar"
            ></i>
            <ThemeToggle />
            <SignOutButton>
              <i
                className="bx bx-log-out logout-btn"
                title="Se déconnecter"
              ></i>
            </SignOutButton>
            <i className="bx bx-arrow-back arrow" onClick={onGoBack}></i>
          </div>
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
      ).isRequired,
    })
  ).isRequired,
  setChats: PropTypes.func.isRequired,
  activeChat: PropTypes.string,
  setActiveChat: PropTypes.func.isRequired,
  onNewChat: PropTypes.func.isRequired,
};

export default ChatBotApp;
