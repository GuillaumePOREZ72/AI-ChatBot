import ChatBotStart from "./components/ChatBotStart";
import ChatBotApp from "./components/ChatBotApp";
import AuthWrapper from "./components/AuthWrapper";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/clerk-react";
import {
  getUserData,
  setUserData,
  migrateExistingData,
} from "./utils/userStorage";

const App = () => {
  const { user, isLoaded } = useUser();
  const [isChatting, setIsChatting] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  // Charger les chats de l'utilisateur connecté
  useEffect(() => {
    if (isLoaded && user) {
      // Migration des données existantes (une seule fois)
      migrateExistingData(user.id);

      // Charger les chats de l'utilisateur
      const userChats = getUserData(user.id, "chats", []);
      setChats(userChats);

      if (userChats.length > 0) {
        setActiveChat(userChats[0].id);
      }
    }
  }, [user, isLoaded]);

  const handleStartChat = () => {
    setIsChatting(true);

    if (chats.length === 0) {
      createNewChat();
    }
  };

  const handleGoBack = () => {
    setIsChatting(false);
  };

  const createNewChat = (initialMessage = "") => {
    if (!user) return; // Sécurité : pas de chat sans utilisateur

    const newChat = {
      id: uuidv4(),
      displayId: `Chat ${new Date().toLocaleDateString(
        "fr-FR"
      )} ${new Date().toLocaleTimeString()}`,
      messages: initialMessage
        ? [
            {
              type: "prompt",
              text: initialMessage,
              timeStamp: new Date().toLocaleTimeString(),
            },
          ]
        : [],
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);

    // Sauvegarder avec le système utilisateur
    setUserData(user.id, "chats", updatedChats);
    setUserData(user.id, `chat_${newChat.id}`, newChat.messages);
    setActiveChat(newChat.id);
  };

  return (
    <AuthWrapper>
      <div className="container">
        {isChatting ? (
          <ChatBotApp
            onGoBack={handleGoBack}
            chats={chats}
            setChats={setChats}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            onNewChat={createNewChat}
          />
        ) : (
          <ChatBotStart onStartChat={handleStartChat} />
        )}
      </div>
    </AuthWrapper>
  );
};

export default App;
