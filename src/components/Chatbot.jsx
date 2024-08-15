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

  const analyzeInput = (inputText) => {
    const normalizedInput = inputText.toLowerCase();

    const healthKeywords = [
      "doctor",
      "medicine",
      "hospital",
      "symptoms",
      "treatment",
      "fever",
      "cough",
      "headache",
      "pain",
      "clinic",
      "unwell",
      "sick",
      "ill",
      "cold",
    ];

    const positiveResponses = [
      "good",
      "well",
      "fine",
      "great",
      "nice",
      "okay",
      "better",
      "feeling good",
    ];

    const negativeResponses = [
      "bad",
      "not well",
      "unwell",
      "sick",
      "ill",
      "feeling bad",
      "not good",
    ];

    if (
      negativeResponses.some((response) => normalizedInput.includes(response))
    ) {
      return "negative";
    }

    if (
      positiveResponses.some((response) => normalizedInput.includes(response))
    ) {
      return "positive";
    }

    if (healthKeywords.some((keyword) => normalizedInput.includes(keyword))) {
      return "health";
    }

    return "off-topic";
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    setIsTyping(true);

    const inputCategory = analyzeInput(input);

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

      if (inputCategory === "positive") {
        await showAiMessageWithDelay(
          "Glad to hear you're feeling well! If you have any health-related questions, feel free to ask."
        );
        setStage(5); // Skip the symptom stage
      } else if (inputCategory === "negative") {
        await showAiMessageWithDelay("What symptoms are you experiencing?");
        setStage(4); // Proceed to the symptom stage
      } else {
        await showAiMessageWithDelay(
          "Could you please specify if you have any health-related concerns or symptoms?"
        );
      }
    } else if (stage === 4) {
      // Append symptoms to existing data
      setUserData((prevData) => ({
        ...prevData,
        symptoms: prevData.symptoms ? `${prevData.symptoms}\n${input}` : input,
      }));

      const prompt = `User Details:
PatientName: ${userData.name}
PatientEmail: ${userData.email}
PatientPhone: ${userData.phone}
PatientFeelings: ${userData.feelings}
PatientSymptoms: ${input}

Provide recommendations based on this information.`;

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
      if (
        input.toLowerCase().includes("hospital") ||
        input.toLowerCase().includes("hospital name")
      ) {
        const prompt = `User Details:
PatientName: ${userData.name}
PatientEmail: ${userData.email}
PatientPhone: ${userData.phone}
PatientFeelings: ${userData.feelings}
PatientSymptoms: ${userData.symptoms}
PatientDoubts: ${input} if the user ask for the address then provide it and if he says thank you , thank you so much etc then response accordingly and if the user ask about some names of the hospitals then provide him with the hospital feature and its address you need to act like a health chatbot`;

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
        } catch (error) {
          console.error("Error communicating with AI:", error);
          await showAiMessageWithDelay(
            "Sorry, I couldn't process your request."
          );
        }
      } else if (inputCategory === "off-topic") {
        await showAiMessageWithDelay(
          "I'm here to assist with health-related inquiries. If you need information on hospitals or treatments, please let me know!"
        );
      } else {
        const additionalPrompt = `User wants to ask a follow-up:
${input}

Provide an appropriate response considering the PatientFeelings and PatientSymptoms fields.`;

        const prompt = `User Details:
PatientName: ${userData.name}
PatientEmail: ${userData.email}
PatientPhone: ${userData.phone}
PatientFeelings: ${userData.feelings}
PatientSymptoms: ${userData.symptoms}
PatientDoubts: ${additionalPrompt} if the user ask for the address then provide it and if he says thank you , thank you so much etc then response accordingly and if the user ask about some names of the hospitals then provide him with the hospital feature and its address you need to act like a health chatbot`;

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
          const followUpResponse =
            response.data.candidates[0].content.parts[0].text;
          await showAiMessageWithDelay(followUpResponse);
        } catch (error) {
          console.error("Error communicating with AI:", error);
          await showAiMessageWithDelay(
            "Sorry, I couldn't process your request."
          );
        }
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
