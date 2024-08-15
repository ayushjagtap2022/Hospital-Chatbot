import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Markdown from "markdown-to-jsx";
import "../css/chatbot.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);
  const [stage, setStage] = useState(0);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    feelings: "",
    symptoms: "",
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showAiMessageWithDelay = async (text) => {
    setIsTyping(true);
    await delay(1000);
    setMessages((prevMessages) => [...prevMessages, { sender: "ai", text }]);
    setIsTyping(false);
  };

  const initializeConversation = async () => {
    const initialMessages = [
      "Hi there! Let's start with some basic information.",
      "What's your name?",
    ];

    for (const msg of initialMessages) {
      await showAiMessageWithDelay(msg);
    }

    setStage(0);
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    setIsTyping(true);

    if (stage === 0) {
      setUserData((prevData) => ({ ...prevData, name: input }));
      await showAiMessageWithDelay("Got it! What's your email (optional)?");
      setStage(1);
    } else if (stage === 1) {
      setUserData((prevData) => ({ ...prevData, email: input }));
      await showAiMessageWithDelay("Thank you! What's your phone number?");
      setStage(2);
    } else if (stage === 2) {
      setUserData((prevData) => ({ ...prevData, phone: input }));
      await showAiMessageWithDelay("How are you feeling today?");
      setStage(3);
    } else if (stage === 3) {
      setUserData((prevData) => ({ ...prevData, feelings: input }));
      await showAiMessageWithDelay("What symptoms are you experiencing?");
      setStage(4);
    } else if (stage === 4) {
      setUserData((prevData) => ({ ...prevData, symptoms: input }));

      const prompt = `User Details:
    PatientName: ${userData.name}
    PatientEmail: ${userData.email}
    PatientPhone: ${userData.phone}
    PatientFeelings: ${userData.feelings}
    PatientSymptoms: ${input}

    Provide recommendations based on this information. Give suggestions about both Ayurvedic and allopathic treatments,provide ansers based on Indian healthcare system. Feel free to message me if you have any doubts.`;

      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyC6H43qonao9BCjw2n5S2ImP115W-k0P6o`,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        await showAiMessageWithDelay(aiResponse);
        await showAiMessageWithDelay(
          "If you have any doubts, feel free to ask!"
        );
        setStage(5);
      } catch (error) {
        console.error("Error communicating with AI:", error);
        await showAiMessageWithDelay("Sorry, I couldn't process your request.");
      }
    } else if (stage === 5) {
      const additionalPrompt = `User wants to ask a follow-up:
    ${input}
    
    Provide an appropriate response considering the PatientFeelings and PatientSymptoms field details.Give answers based on Indian health care system(Note:if the user ask about any hospital address then provide him/her the address of that hospital)`;

      const prompt = `User Details:
    PatientName: ${userData.name}
    PatientEmail: ${userData.email}
    PatientPhone: ${userData.phone}
    PatientFeelings: ${userData.feelings}
    PatientSymptoms: ${userData.symptoms}
    PatientDoubts:${additionalPrompt}
    `;
      try {
        console.log(prompt);

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyC6H43qonao9BCjw2n5S2ImP115W-k0P6o`,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const followUpResponse =
          response.data.candidates[0].content.parts[0].text;
        await showAiMessageWithDelay(followUpResponse);
      } catch (error) {
        console.error("Error communicating with AI:", error);
        await showAiMessageWithDelay("Sorry, I couldn't process your request.");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="chatbot-icon" onClick={toggleChat}>
        <img
          src="images/chat.png"
          width="50px"
          height="50px"
          alt="Chatbot Icon"
        />
      </div>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span className="chat-header-name">Chat Bot</span>
            <button className="close-btn" onClick={toggleChat}>
              <img
                src="images/crossicon.png"
                width="25px"
                height="25px"
                alt=""
              />
            </button>
          </div>
          <div className="chat-body">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <Markdown>{msg.text}</Markdown>
              </div>
            ))}
            {isTyping && (
              <div className="message ai typing">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
